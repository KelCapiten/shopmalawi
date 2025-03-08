//src/controllers/messagesControllers/ConversationController.js
import db from "../../config/db.js";
import DbTransactionService from "../../services/dbTransactionService.js";
import ErrorHandlingService from "../../services/ErrorHandlingService.js";
import ParticipantVerificationService from "../../services/ParticipantVerificationService.js";
import { cache } from "../../services/cacheService.js";

class ConversationController {
  // Create new conversation
  // Create new conversation
  async createConversation(req, res) {
    try {
      const { participantIds, initialMessage, title, description, isGroup } =
        req.body;
      const userId = req.user.id;

      if (
        !participantIds ||
        !Array.isArray(participantIds) ||
        participantIds.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Invalid or empty participants list" });
      }

      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
      }
      const uniqueParticipantIds = [...new Set(participantIds)];

      if (uniqueParticipantIds.length === 1) {
        return res
          .status(400)
          .json({ error: "Cannot create a conversation with only yourself" });
      }

      const result = await DbTransactionService.withTransaction(
        async (connection) => {
          const [validUsers] = await connection.query(
            "SELECT id FROM users WHERE id IN (?)",
            [uniqueParticipantIds]
          );
          if (validUsers.length !== uniqueParticipantIds.length) {
            throw new Error("One or more invalid participants");
          }

          // For 1:1 chats, check if an existing non-group conversation exists.
          if (!isGroup && uniqueParticipantIds.length === 2) {
            const [existingConversation] = await connection.query(
              `SELECT c.id 
           FROM conversations c
           JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
           JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
           JOIN conversation_metadata cm ON c.id = cm.conversation_id
           WHERE cm.is_group = 0
           AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2`,
              [uniqueParticipantIds[0], uniqueParticipantIds[1]]
            );
            if (existingConversation && existingConversation.length > 0) {
              return existingConversation[0].id;
            }
          }

          // Create a new conversation
          const [conversation] = await connection.query(
            "INSERT INTO conversations () VALUES ()",
            []
          );

          // Add participants
          const participantValues = uniqueParticipantIds.map((id) => [
            conversation.insertId,
            id,
          ]);
          await connection.query(
            "INSERT INTO conversation_participants (conversation_id, user_id) VALUES ?",
            [participantValues]
          );

          // Prepare conversation metadata
          let metaTitle = title || null;
          let metaAvatarUrl = null;
          if (!isGroup && uniqueParticipantIds.length === 2) {
            const recipientId = uniqueParticipantIds.find(
              (id) => id !== userId
            );
            const [recipientRows] = await connection.query(
              "SELECT username, (SELECT image_path FROM images WHERE id = profile_picture_id) as avatar_url FROM users WHERE id = ?",
              [recipientId]
            );
            if (recipientRows && recipientRows.length > 0) {
              metaTitle = recipientRows[0].username;
              metaAvatarUrl = recipientRows[0].avatar_url;
            }
          }

          // Insert conversation metadata with the recipient's username and profile picture if applicable
          await connection.query(
            `INSERT INTO conversation_metadata
         (conversation_id, title, description, avatar_url, is_group, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
            [
              conversation.insertId,
              metaTitle,
              description || null,
              metaAvatarUrl,
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

      (async () => {
        try {
          await cache.del(`conversations:${userId}*`);
          for (const participantId of uniqueParticipantIds) {
            if (participantId !== userId) {
              await cache.del(`conversations:${participantId}*`);
            }
          }
        } catch (err) {
          console.error(`Cache deletion error:`, err);
        }
      })();

      res.status(201).json({ id: result });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get all conversations for a user
  async getConversationsList(req, res) {
    try {
      const cacheKey = `conversations:${req.user.id}:${req.query.page || 1}:${
        req.query.limit || 20
      }`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // Enhanced query to include more conversation metadata and participant information
      const query = `
      SELECT 
        c.*,
        cm.title,
        cm.description,
        cm.is_group,
        cm.avatar_url,
        cm.created_by,
        COUNT(DISTINCT CASE WHEN m.is_read = FALSE AND m.sender_id != ? THEN m.id END) as unread_count,
        (
          SELECT MAX(m2.created_at) 
          FROM messages m2 
          WHERE m2.conversation_id = c.id
        ) as last_activity,
        JSON_OBJECT(
          'id', m.id,
          'text', m.text,
          'sender_id', m.sender_id,
          'created_at', m.created_at,
          'delivery_status', m.delivery_status,
          'is_read', m.is_read,
          'has_attachments', (SELECT COUNT(*) > 0 FROM message_attachments ma WHERE ma.message_id = m.id)
        ) as last_message,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'user_id', u.id,
              'username', u.username,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'profile_picture_url', (SELECT image_path FROM images WHERE id = u.profile_picture_id),
              'status', COALESCE(up.status, 'offline'),
              'last_active', up.last_active,
              'joined_at', cp2.joined_at,
              'last_read_at', cp2.last_read_at
            )
          )
          FROM conversation_participants cp2
          JOIN users u ON cp2.user_id = u.id
          LEFT JOIN user_presence up ON u.id = up.user_id
          WHERE cp2.conversation_id = c.id
        ) as participants,
        (
          SELECT COUNT(*)
          FROM messages msg
          WHERE msg.conversation_id = c.id
          AND msg.deleted_at IS NULL
        ) as message_count,
        cp.last_read_at as current_user_last_read,
        cp.joined_at as current_user_joined_at
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = ?
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
        userId,
        parseInt(limit),
        parseInt(offset),
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

      // Safely parse JSON strings or use objects directly
      function safeJsonParse(value, defaultValue = null) {
        if (!value) return defaultValue;
        if (typeof value !== "string") return value;

        try {
          return JSON.parse(value);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          return defaultValue;
        }
      }

      // Process each conversation to format data
      const processedConversations = conversations.map((conversation) => {
        conversation.participants = safeJsonParse(
          conversation.participants,
          []
        );
        conversation.last_message = safeJsonParse(conversation.last_message);

        conversation.is_one_on_one =
          !conversation.is_group &&
          Array.isArray(conversation.participants) &&
          conversation.participants.length === 2;

        if (conversation.is_one_on_one) {
          conversation.other_participant =
            conversation.participants.find((p) => p.user_id !== userId) || null;
        }

        return conversation;
      });

      const result = {
        conversations: processedConversations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache the result with TTL of 60 seconds
      (async () => {
        try {
          await cache.set(cacheKey, JSON.stringify(result), 60);
        } catch (err) {
          console.error(`Cache set error for key ${cacheKey}:`, err);
        }
      })();

      res.json(result);
    } catch (error) {
      console.error("Error in getConversationsList:", error);
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get single conversation with messages
  async getConversation(req, res) {
    try {
      const conversationId = req.params.conversationId;
      const userId = req.user.id;

      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );
      if (!isParticipant) {
        return res
          .status(403)
          .json({ error: "Not authorized to access this conversation" });
      }

      const { page, limit, offset } = (() => {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const offset = (page - 1) * limit;
        return { page, limit, offset };
      })();

      const cacheKey = `conversation:${conversationId}:${page}:${limit}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const [messages] = await db.query(
        `SELECT 
           id, conversation_id, sender_id, text, parent_message_id, delivery_status, 
           created_at, edited_at, deleted_at, is_read, has_attachments, attachment_id, 
           file_type, file_path, file_name, forwarded_from
         FROM messages 
         WHERE conversation_id = ? AND deleted_at IS NULL
         ORDER BY created_at ASC
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );

      const messageIds = messages.map((msg) => msg.id);
      let reactions = [];
      if (messageIds.length) {
        const [reactionRows] = await db.query(
          "SELECT * FROM message_reactions WHERE message_id IN (?)",
          [messageIds]
        );
        reactions = reactionRows;
      }

      let readReceipts = [];
      if (messageIds.length) {
        const [receiptRows] = await db.query(
          "SELECT * FROM read_receipts WHERE message_id IN (?)",
          [messageIds]
        );
        readReceipts = receiptRows;
      }

      const reactionsByMsg = reactions.reduce((acc, r) => {
        acc[r.message_id] = acc[r.message_id] || [];
        acc[r.message_id].push(r);
        return acc;
      }, {});

      const receiptsByMsg = readReceipts.reduce((acc, r) => {
        acc[r.message_id] = acc[r.message_id] || [];
        acc[r.message_id].push(r);
        return acc;
      }, {});

      const enrichedMessages = messages.map((msg) => ({
        ...msg,
        reactions: reactionsByMsg[msg.id] || [],
        read_receipts: receiptsByMsg[msg.id] || [],
      }));

      const [totalCountRows] = await db.query(
        `SELECT COUNT(*) as total FROM messages 
         WHERE conversation_id = ? AND deleted_at IS NULL`,
        [conversationId]
      );
      const total = totalCountRows[0].total;

      const result = {
        conversationId,
        messages: enrichedMessages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      };

      await cache.set(cacheKey, JSON.stringify(result), 60);
      res.json(result);
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

      // Asynchronously clear cache for conversations list
      (async () => {
        try {
          await cache.del(`conversations:${userId}*`);
        } catch (err) {
          console.error(`Cache deletion error for user ${userId}:`, err);
        }
      })();

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

      // Asynchronously clear cache for conversations list
      (async () => {
        try {
          await cache.del(`conversations:${userId}*`);
        } catch (err) {
          console.error(`Cache deletion error for user ${userId}:`, err);
        }
      })();

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

      // Asynchronously clear cache for conversations list
      (async () => {
        try {
          await cache.del(`conversations:${userId}*`);
        } catch (err) {
          console.error(`Cache deletion error for user ${userId}:`, err);
        }
      })();

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

      // Asynchronously clear cache for conversations list
      (async () => {
        try {
          await cache.del(`conversations:${userId}*`);
        } catch (err) {
          console.error(`Cache deletion error for user ${userId}:`, err);
        }
      })();

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
