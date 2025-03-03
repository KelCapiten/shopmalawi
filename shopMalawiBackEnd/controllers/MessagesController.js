import db from "../config/db.js";
import DbTransactionService from "../services/DbTransactionService.js";
import ErrorHandlingService from "../services/ErrorHandlingService.js";
import { uploadFile } from "../services/FileUploadService.js";
import { cache } from "../config/cache.js";

class MessagesController {
  async getConversations(req, res) {
    try {
      const cacheKey = `conversations:${req.user.id}:${req.query.page || 1}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Updated query to include conversation metadata and unread count
      const query = `
        SELECT 
          c.*,
          cm.title,
          cm.description,
          cm.is_group,
          cm.avatar_url,
          COUNT(DISTINCT CASE WHEN m.is_read = FALSE AND m.sender_id != ? THEN m.id END) as unread_count,
          JSON_OBJECT(
            'id', m.id,
            'text', m.text,
            'sender_id', m.sender_id,
            'created_at', m.created_at,
            'delivery_status', m.delivery_status
          ) as last_message
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN conversation_metadata cm ON c.id = cm.conversation_id
        LEFT JOIN messages m ON m.id = c.last_message_id
        WHERE cp.user_id = ? 
        AND c.deleted_at IS NULL
        AND cp.is_archived = FALSE
        GROUP BY c.id
        ORDER BY COALESCE(c.updated_at, c.created_at) DESC
        LIMIT ? OFFSET ?
      `;

      const [conversations] = await db.query(query, [
        userId,
        userId,
        limit,
        offset,
      ]);

      // Get total count for pagination
      const [{ total }] = await db.query(
        `SELECT COUNT(DISTINCT c.id) as total 
         FROM conversations c 
         JOIN conversation_participants cp ON c.id = cp.conversation_id 
         WHERE cp.user_id = ? 
         AND c.deleted_at IS NULL 
         AND cp.is_archived = FALSE`,
        [userId]
      );

      const result = {
        conversations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      };

      await cache.set(cacheKey, JSON.stringify(result), 300); // Cache for 5 minutes
      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get single conversation with messages
  async getConversation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // First verify user is a participant
      const participantQuery = `
                SELECT 1 FROM conversation_participants 
                WHERE conversation_id = ? AND user_id = ?
            `;
      const [isParticipant] = await db.query(participantQuery, [id, userId]);

      if (!isParticipant.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this conversation" });
      }

      const query = `
        SELECT 
          m.*, 
          ma.id as attachment_id,
          ma.file_type,
          ma.file_path,
          ma.file_name,
          cm.title,
          cm.description,
          cm.is_group,
          cm.avatar_url,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', mr.id,
              'user_id', mr.user_id,
              'reaction_type', mr.reaction_type
            )
          ) as reactions,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'user_id', mrr.user_id,
                'read_at', mrr.read_at
              )
            )
            FROM message_read_receipts mrr
            WHERE mrr.message_id = m.id
          ) as read_receipts
        FROM messages m
        LEFT JOIN message_attachments ma ON m.id = ma.message_id
        LEFT JOIN conversation_metadata cm ON m.conversation_id = cm.conversation_id
        LEFT JOIN message_reactions mr ON m.id = mr.message_id
        WHERE m.conversation_id = ?
        AND m.deleted_at IS NULL
        GROUP BY m.id
        ORDER BY m.created_at ASC
      `;
      const [messages] = await db.query(query, [id]);
      res.json(messages);
    } catch (error) {
      console.error("Error in getConversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Create new conversation
  async createConversation(req, res) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { participantIds, initialMessage, title, description, isGroup } =
        req.body;
      const userId = req.user.id;

      // Ensure current user is included in participants
      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
      }

      // Create conversation
      const [conversation] = await connection.query(
        "INSERT INTO conversations () VALUES ()",
        []
      );

      // Add participants
      const participantValues = participantIds.map((id) => [
        conversation.insertId,
        id,
      ]);
      await connection.query(
        "INSERT INTO conversation_participants (conversation_id, user_id) VALUES ?",
        [participantValues]
      );

      // Add conversation metadata
      await connection.query(
        `INSERT INTO conversation_metadata 
         (conversation_id, title, description, is_group, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [conversation.insertId, title, description, isGroup || false, userId]
      );

      // Add initial message if provided
      if (initialMessage) {
        await connection.query(
          "INSERT INTO messages (conversation_id, sender_id, text) VALUES (?, ?, ?)",
          [conversation.insertId, userId, initialMessage]
        );
      }

      await connection.commit();
      res.status(201).json({ id: conversation.insertId });
    } catch (error) {
      await connection.rollback();
      console.error("Error in createConversation:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      connection.release();
    }
  }

  async sendMessage(req, res) {
    try {
      const { conversationId, text, parentMessageId } = req.body;
      const userId = req.user.id;
      const files = req.files;

      const result = await DbTransactionService.withTransaction(
        async (connection) => {
          // Verify user is participant
          const [isParticipant] = await connection.query(
            `SELECT 1 FROM conversation_participants 
             WHERE conversation_id = ? AND user_id = ?`,
            [conversationId, userId]
          );

          if (!isParticipant.length) {
            throw new Error(
              "Not authorized to send message in this conversation"
            );
          }

          // Insert message
          const [result] = await connection.query(
            `INSERT INTO messages 
             (conversation_id, sender_id, text, parent_message_id, delivery_status) 
             VALUES (?, ?, ?, ?, 'sent')`,
            [conversationId, userId, text, parentMessageId]
          );

          // Handle attachments
          if (files?.length) {
            await Promise.all(
              files.map((file) => uploadFile(file, connection, result.insertId))
            );
          }

          // Update conversation
          await connection.query(
            `UPDATE conversations 
           SET last_message_id = ?, 
           updated_at = NOW() 
           WHERE id = ?`,
            [result.insertId, conversationId]
          );

          // Clear conversation cache
          await cache.del(`conversations:${userId}*`);
          await cache.del(`conversation:${conversationId}`);

          return { messageId: result.insertId };
        }
      );

      res.status(201).json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await db.query(
        `UPDATE conversation_participants 
                 SET last_read_at = NOW() 
                 WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in markAsRead:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Add reaction to message
  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body; // The emoji reaction (e.g., "👍", "❤️", "😂")
      const userId = req.user.id;

      // Validate emoji input
      const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "😠"];
      if (!validEmojis.includes(emoji)) {
        return res.status(400).json({ error: "Invalid emoji reaction" });
      }

      // Check if message exists
      const [message] = await db.query(
        "SELECT 1 FROM messages WHERE id = ? AND deleted_at IS NULL",
        [messageId]
      );

      if (!message.length) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Use REPLACE to handle both insert and update cases
      await db.query(
        `REPLACE INTO message_reactions 
         (message_id, user_id, reaction_type) 
         VALUES (?, ?, ?)`,
        [messageId, userId, emoji]
      );

      res.status(200).json({ success: true, reaction: emoji });
    } catch (error) {
      console.error("Error in addReaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get reactions for a message with pagination
  async getMessageReactions(req, res) {
    try {
      const { messageId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const [reactions] = await db.query(
        `SELECT 
          mr.reaction_type as emoji,
          COUNT(*) as count,
          GROUP_CONCAT(u.username) as users
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = ?
         GROUP BY mr.reaction_type
         LIMIT ? OFFSET ?`,
        [messageId, Number(limit), offset]
      );

      // Get total count for pagination
      const [{ total }] = await db.query(
        `SELECT COUNT(*) as total FROM message_reactions WHERE message_id = ?`,
        [messageId]
      );

      res.json({
        reactions,
        pagination: { page: Number(page), limit: Number(limit), total },
      });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Edit message
  async editMessage(req, res) {
    try {
      const { messageId } = req.params;
      const { text } = req.body;
      const userId = req.user.id;

      const [message] = await db.query(
        `SELECT * FROM messages WHERE id = ? AND sender_id = ?`,
        [messageId, userId]
      );

      if (!message.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to edit this message" });
      }

      await db.query(
        `UPDATE messages 
         SET text = ?, edited_at = NOW() 
         WHERE id = ?`,
        [text, messageId]
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Update typing status
  async updateTypingStatus(req, res) {
    try {
      const { conversationId } = req.params;
      const { isTyping } = req.body;
      const userId = req.user.id;

      await cache.set(
        `typing:${conversationId}:${userId}`,
        isTyping,
        60 // expires in 60 seconds
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get typing status
  async getTypingStatus(req, res) {
    try {
      const { conversationId } = req.params;
      const [participants] = await db.query(
        `SELECT user_id FROM conversation_participants WHERE conversation_id = ?`,
        [conversationId]
      );

      const typingUsers = await Promise.all(
        participants.map(async (p) => {
          const isTyping = await cache.get(
            `typing:${conversationId}:${p.user_id}`
          );
          return isTyping ? p.user_id : null;
        })
      );

      res.json({ typingUsers: typingUsers.filter(Boolean) });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Update message delivery status
  async updateDeliveryStatus(req, res) {
    try {
      const { messageId } = req.params;
      const { status } = req.body; // 'delivered' or 'failed'

      await db.query(
        `UPDATE messages 
         SET delivery_status = ?, 
             delivered_at = CASE WHEN ? = 'delivered' THEN NOW() ELSE NULL END
         WHERE id = ?`,
        [status, status, messageId]
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Remove reaction from message
  async removeReaction(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await db.query(
        `DELETE FROM message_reactions 
                 WHERE message_id = ? AND user_id = ?`,
        [messageId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in removeReaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete message (soft delete)
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      // Check if user owns the message
      const [message] = await db.query(
        `SELECT 1 FROM messages 
                 WHERE id = ? AND sender_id = ?`,
        [messageId, userId]
      );

      if (!message.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this message" });
      }

      await db.query(
        `UPDATE messages 
                 SET deleted_at = NOW() 
                 WHERE id = ?`,
        [messageId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in deleteMessage:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Archive conversation
  async archiveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await db.query(
        `UPDATE conversation_participants 
                 SET is_archived = TRUE 
                 WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in archiveConversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Unarchive conversation
  async unarchiveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await db.query(
        `UPDATE conversation_participants 
                 SET is_archived = FALSE 
                 WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in unarchiveConversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete conversation (soft delete)
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Verify user is a participant
      const [isParticipant] = await db.query(
        `SELECT 1 FROM conversation_participants 
                 WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!isParticipant.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this conversation" });
      }

      await db.query(
        `UPDATE conversations 
                 SET deleted_at = NOW() 
                 WHERE id = ?`,
        [conversationId]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in deleteConversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Add new methods for conversation metadata management
  async updateConversationMetadata(req, res) {
    try {
      const { conversationId } = req.params;
      const { title, description, avatarUrl } = req.body;
      const userId = req.user.id;

      await db.query(
        `UPDATE conversation_metadata 
         SET title = ?, description = ?, avatar_url = ?
         WHERE conversation_id = ? AND created_by = ?`,
        [title, description, avatarUrl, conversationId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add method to get user presence
  async getUserPresence(req, res) {
    try {
      const { userIds } = req.query;
      const ids = userIds.split(",");

      const [presence] = await db.query(
        `SELECT user_id, status, last_active 
         FROM user_presence 
         WHERE user_id IN (?)`,
        [ids]
      );

      res.json(presence);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add this new method for bulk operations
  async bulkMarkAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      const userId = req.user.id;

      // First verify user is participant in all conversations
      const [validMessages] = await db.query(
        `
        SELECT DISTINCT m.id 
        FROM messages m
        JOIN conversation_participants cp 
          ON m.conversation_id = cp.conversation_id
        WHERE m.id IN (?) 
        AND cp.user_id = ?
      `,
        [messageIds, userId]
      );

      const validIds = validMessages.map((m) => m.id);

      if (validIds.length > 0) {
        await db.query(
          `
          UPDATE messages 
          SET is_read = TRUE 
          WHERE id IN (?)
        `,
          [validIds]
        );

        // Update last_read_at for affected conversations
        await db.query(
          `
          UPDATE conversation_participants cp
          JOIN messages m ON cp.conversation_id = m.conversation_id
          SET cp.last_read_at = NOW()
          WHERE m.id IN (?)
          AND cp.user_id = ?
        `,
          [validIds, userId]
        );

        // Invalidate relevant cache entries
        const [conversations] = await db.query(
          "SELECT DISTINCT conversation_id FROM messages WHERE id IN (?)",
          [validIds]
        );

        await Promise.all(
          conversations.map((c) =>
            cache.del(`conversation:${c.conversation_id}`)
          )
        );
      }

      res.json({ success: true, messagesUpdated: validIds.length });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add message search functionality
  async searchMessages(req, res) {
    try {
      const { conversationId, query, page = 1, limit = 20 } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      // First verify user is participant
      const [isParticipant] = await db.query(
        `SELECT 1 FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!isParticipant.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this conversation" });
      }

      // Search messages using FULLTEXT index
      const searchQuery = `
        SELECT m.*, 
               JSON_OBJECT(
                 'id', u.id,
                 'username', u.username,
                 'avatar', u.avatar_url
               ) as sender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        AND m.deleted_at IS NULL
        AND MATCH(m.text) AGAINST(? IN NATURAL LANGUAGE MODE)
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [messages] = await db.query(searchQuery, [
        conversationId,
        query,
        Number(limit),
        offset,
      ]);

      // Get total count for pagination
      const [{ total }] = await db.query(
        `SELECT COUNT(*) as total 
         FROM messages 
         WHERE conversation_id = ?
         AND deleted_at IS NULL
         AND MATCH(text) AGAINST(? IN NATURAL LANGUAGE MODE)`,
        [conversationId, query]
      );

      res.json({
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add message pagination with cursor
  async getMessagesByCursor(req, res) {
    try {
      const {
        conversationId,
        cursor,
        limit = 20,
        direction = "before",
      } = req.query;
      const userId = req.user.id;

      // Verify participant
      const [isParticipant] = await db.query(
        `SELECT 1 FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!isParticipant.length) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Build query based on direction
      const operator = direction === "before" ? "<" : ">";
      const orderDir = direction === "before" ? "DESC" : "ASC";

      const query = `
        SELECT m.*, 
               JSON_OBJECT(
                 'id', u.id,
                 'username', u.username,
                 'avatar', u.avatar_url
               ) as sender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        AND m.deleted_at IS NULL
        ${
          cursor
            ? `AND m.created_at ${operator} (SELECT created_at FROM messages WHERE id = ?)`
            : ""
        }
        ORDER BY m.created_at ${orderDir}
        LIMIT ?
      `;

      const params = cursor
        ? [conversationId, cursor, Number(limit)]
        : [conversationId, Number(limit)];

      const [messages] = await db.query(query, params);

      // If fetching older messages, reverse the array to maintain chronological order
      if (direction === "before") {
        messages.reverse();
      }

      res.json({
        messages,
        cursor: {
          next: messages.length ? messages[messages.length - 1].id : null,
          prev: messages.length ? messages[0].id : null,
        },
      });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add new method for forwarding messages
  async forwardMessage(req, res) {
    try {
      const { messageId, conversationIds } = req.body;
      const userId = req.user.id;

      // Get original message
      const [message] = await db.query(
        "SELECT text, sender_id FROM messages WHERE id = ?",
        [messageId]
      );

      if (!message.length) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Forward to each conversation
      await Promise.all(
        conversationIds.map(async (convId) => {
          await this.sendMessage(
            {
              ...req,
              body: {
                conversationId: convId,
                text: message[0].text,
                forwardedFrom: messageId,
              },
            },
            res
          );
        })
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add method for pinning conversations
  async pinConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await db.query(
        `UPDATE conversation_participants 
         SET is_pinned = TRUE,
         pinned_at = NOW()
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      // Clear conversation cache
      await cache.del(`conversations:${userId}*`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add method for read receipts
  async updateReadReceipt(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await db.query(
        `INSERT INTO message_read_receipts (message_id, user_id, read_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = NOW()`,
        [messageId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
}

export default MessagesController;
