//src/controllers/messagesControllers/ConversationController.js
import db from "../../config/db.js";
import DbTransactionService from "../../services/dbTransactionService.js";
import ErrorHandlingService from "../../services/ErrorHandlingService.js";
import ParticipantVerificationService from "../../services/ParticipantVerificationService.js";
import { cache } from "../../services/cacheService.js";

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

      // Check for unique participants (remove duplicates)
      const uniqueParticipantIds = [...new Set(participantIds)];

      // Error if there's only one unique participant (trying to chat with self)
      if (uniqueParticipantIds.length === 1) {
        return res
          .status(400)
          .json({ error: "Cannot create a conversation with only yourself" });
      }

      const result = await DbTransactionService.withTransaction(
        async (connection) => {
          // Validate participants exist
          const [validUsers] = await connection.query(
            "SELECT id FROM users WHERE id IN (?)",
            [uniqueParticipantIds]
          );

          if (validUsers.length !== uniqueParticipantIds.length) {
            throw new Error("One or more invalid participants");
          }

          // Only check for existing conversations when not creating a group chat
          if (!isGroup) {
            if (uniqueParticipantIds.length === 2) {
              // For 1:1 conversations, check if a non-group conversation already exists between these users
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
                // If conversation exists and there's an initial message to add
                if (initialMessage) {
                  await connection.query(
                    "INSERT INTO messages (conversation_id, sender_id, text, delivery_status) VALUES (?, ?, ?, ?)",
                    [existingConversation[0].id, userId, initialMessage, "sent"]
                  );
                }
                return existingConversation[0].id;
              }
            } else if (uniqueParticipantIds.length > 2) {
              // For multi-user non-group chats, check if a conversation with exactly these participants exists
              // First, get all conversations where all the specified participants are members
              const [potentialConversations] = await connection.query(
                `SELECT cp.conversation_id 
               FROM conversation_participants cp
               JOIN conversation_metadata cm ON cp.conversation_id = cm.conversation_id
               WHERE cp.user_id IN (?)
               AND cm.is_group = 0
               GROUP BY cp.conversation_id
               HAVING COUNT(DISTINCT cp.user_id) = ?`,
                [uniqueParticipantIds, uniqueParticipantIds.length]
              );

              // Now check if any of these conversations have exactly these participants (no extra members)
              for (const convo of potentialConversations) {
                const [memberCount] = await connection.query(
                  `SELECT COUNT(*) as count 
                 FROM conversation_participants 
                 WHERE conversation_id = ?`,
                  [convo.conversation_id]
                );

                if (memberCount[0].count === uniqueParticipantIds.length) {
                  // Found a conversation with exactly the same participants
                  if (initialMessage) {
                    await connection.query(
                      "INSERT INTO messages (conversation_id, sender_id, text, delivery_status) VALUES (?, ?, ?, ?)",
                      [convo.conversation_id, userId, initialMessage, "sent"]
                    );
                  }
                  return convo.conversation_id;
                }
              }
            }
          }

          // No existing conversation found or creating a group chat, create a new one
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

      // Asynchronously clear cache for conversations list for the user
      (async () => {
        try {
          await cache.del(`conversations:${userId}*`);

          // Clear cache for all participants
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
        // Safely parse JSON values
        conversation.participants = safeJsonParse(
          conversation.participants,
          []
        );
        conversation.last_message = safeJsonParse(conversation.last_message);

        // Calculate additional metadata
        conversation.is_one_on_one =
          !conversation.is_group &&
          Array.isArray(conversation.participants) &&
          conversation.participants.length === 2;

        // If it's a one-on-one chat, get the other participant for easy access
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
