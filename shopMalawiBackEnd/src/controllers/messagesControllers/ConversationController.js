import db from "../../config/db.js";
import DbTransactionService from "../../services/DbTransactionService.js";
import ErrorHandlingService from "../../services/ErrorHandlingService.js";
import ParticipantVerificationService from "../../services/ParticipantVerificationService.js";
import { cache } from "../../config/cache.js";

class ConversationController {
  // Create new conversation
  async createConversation(req, res) {
    try {
      const { participantIds, initialMessage, title, description, isGroup } =
        req.body;
      const userId = req.user.id;

      // Input validation
      if (
        !participantIds ||
        !Array.isArray(participantIds) ||
        participantIds.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Invalid or empty participants list" });
      }

      // Ensure current user is included in participants
      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
      }

      const result = await DbTransactionService.withTransaction(
        async (connection) => {
          // Validate participants exist
          const [validUsers] = await connection.query(
            "SELECT id FROM users WHERE id IN (?)",
            [participantIds]
          );

          if (validUsers.length !== participantIds.length) {
            throw new Error("One or more invalid participants");
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
            [
              conversation.insertId,
              title || null,
              description || null,
              isGroup || false,
              userId,
            ]
          );

          // Add initial message if provided
          if (initialMessage) {
            await connection.query(
              "INSERT INTO messages (conversation_id, sender_id, text, delivery_status) VALUES (?, ?, ?, ?)",
              [conversation.insertId, userId, initialMessage, "sent"]
            );
          }

          return conversation.insertId;
        }
      );

      await cache.del(`conversations:${userId}*`);
      res.status(201).json({ id: result });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
  // Get all conversations for a user
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

      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(id, userId);
      if (!isParticipant) {
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
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Delete conversation (soft delete)
  async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );
      if (!isParticipant) {
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
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Archive conversation
  async archiveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );
      if (!isParticipant) {
        return res
          .status(403)
          .json({ error: "Not authorized to archive this conversation" });
      }

      await db.query(
        `UPDATE conversation_participants 
         SET is_archived = TRUE 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Unarchive conversation
  async unarchiveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );
      if (!isParticipant) {
        return res
          .status(403)
          .json({ error: "Not authorized to unarchive this conversation" });
      }

      await db.query(
        `UPDATE conversation_participants 
         SET is_archived = FALSE 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
  // Update conversation metadata
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

  // Pin conversation
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

  // Unpin conversation
  async unpinConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      await db.query(
        `UPDATE conversation_participants 
         SET is_pinned = FALSE,
         pinned_at = NULL
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

  // Mark all messages in a conversation as read
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

  // Get user presence
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
}

export default ConversationController;
