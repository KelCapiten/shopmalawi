//src/controllers/messagesControllers/MessageController.js
import db from "../../config/db.js";
import DbTransactionService from "../../services/dbTransactionService.js";
import ErrorHandlingService from "../../services/ErrorHandlingService.js";
import { uploadFile } from "../../services/FileUploadService.js";
import { cache } from "../../services/cacheService.js";

class MessageController {
  // Send a new message
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
          const [insertResult] = await connection.query(
            `INSERT INTO messages 
             (conversation_id, sender_id, text, parent_message_id, delivery_status) 
             VALUES (?, ?, ?, ?, 'sent')`,
            [conversationId, userId, text, parentMessageId]
          );

          // Handle attachments if any
          if (files?.length) {
            await Promise.all(
              files.map((file) =>
                uploadFile(file, connection, insertResult.insertId)
              )
            );
          }

          // Update conversation with the new last message
          await connection.query(
            `UPDATE conversations 
             SET last_message_id = ?, 
             updated_at = NOW() 
             WHERE id = ?`,
            [insertResult.insertId, conversationId]
          );

          // Asynchronously clear conversation-related cache entries
          (async () => {
            try {
              await cache.del(`conversations:${userId}*`);
              await cache.del(`conversation:${conversationId}`);
            } catch (err) {
              console.error(
                `Cache invalidation error for conversation ${conversationId}:`,
                err
              );
            }
          })();

          return { messageId: insertResult.insertId };
        }
      );

      res.status(201).json(result);
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

  // Update message delivery status
  async updateDeliveryStatus(req, res) {
    try {
      const { messageId } = req.params;
      const { status } = req.body; // expected values: 'delivered' or 'failed'

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

  // Forward message
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
      const results = await Promise.all(
        conversationIds.map(async (convId) => {
          // Verify user is participant in this conversation
          const [isParticipant] = await db.query(
            `SELECT 1 FROM conversation_participants 
             WHERE conversation_id = ? AND user_id = ?`,
            [convId, userId]
          );

          if (!isParticipant.length) {
            return {
              conversationId: convId,
              success: false,
              error: "Not authorized",
            };
          }

          // Insert forwarded message
          const [insertResult] = await db.query(
            `INSERT INTO messages 
             (conversation_id, sender_id, text, forwarded_from, delivery_status) 
             VALUES (?, ?, ?, ?, 'sent')`,
            [convId, userId, message[0].text, messageId]
          );

          // Update conversation's last message
          await db.query(
            `UPDATE conversations 
             SET last_message_id = ?, updated_at = NOW() 
             WHERE id = ?`,
            [insertResult.insertId, convId]
          );

          // Asynchronously clear cache for this conversation
          (async () => {
            try {
              await cache.del(`conversation:${convId}`);
            } catch (err) {
              console.error(
                `Cache deletion error for conversation ${convId}:`,
                err
              );
            }
          })();

          return {
            conversationId: convId,
            success: true,
            messageId: insertResult.insertId,
          };
        })
      );

      res.json({ success: true, results });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Update read receipt for a message
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

  // Bulk mark messages as read
  async bulkMarkAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      const userId = req.user.id;

      // Verify user is participant in all conversations
      const [validMessages] = await db.query(
        `SELECT DISTINCT m.id 
         FROM messages m
         JOIN conversation_participants cp 
           ON m.conversation_id = cp.conversation_id
         WHERE m.id IN (?) 
         AND cp.user_id = ?`,
        [messageIds, userId]
      );

      const validIds = validMessages.map((m) => m.id);

      if (validIds.length > 0) {
        await db.query(
          `UPDATE messages 
           SET is_read = TRUE 
           WHERE id IN (?)`,
          [validIds]
        );

        // Update last_read_at for affected conversations
        await db.query(
          `UPDATE conversation_participants cp
           JOIN messages m ON cp.conversation_id = m.conversation_id
           SET cp.last_read_at = NOW()
           WHERE m.id IN (?)
           AND cp.user_id = ?`,
          [validIds, userId]
        );

        // Invalidate relevant cache entries
        const [conversations] = await db.query(
          "SELECT DISTINCT conversation_id FROM messages WHERE id IN (?)",
          [validIds]
        );

        await Promise.all(
          conversations.map((c) =>
            (async () => {
              try {
                await cache.del(`conversation:${c.conversation_id}`);
              } catch (err) {
                console.error(
                  `Cache deletion error for conversation ${c.conversation_id}:`,
                  err
                );
              }
            })()
          )
        );
      }

      res.json({ success: true, messagesUpdated: validIds.length });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get messages by cursor (pagination) with conditional caching, including attachments, reactions, and read receipts
  async getMessagesByCursor(req, res) {
    try {
      const {
        conversationId,
        cursor,
        limit = 20,
        direction = "before",
      } = req.query;
      const userId = req.user.id;

      // Verify that the user is a participant in the conversation
      const [isParticipant] = await db.query(
        `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!isParticipant.length) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Check if cached data exists
      let cachedData = await cache.get(`conversation:${conversationId}`);
      if (cachedData) {
        console.log("Serving messages from cache");
        return res.json(JSON.parse(cachedData));
      }

      // Build the query based on pagination direction
      const operator = direction === "before" ? "<" : ">";
      const orderDir = direction === "before" ? "DESC" : "ASC";

      const query = `
      SELECT 
        m.*, 
        JSON_OBJECT(
          'id', u.id,
          'username', u.username,
          'avatar', u.avatar_url
        ) AS sender,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', ma.id,
              'file_type', ma.file_type,
              'file_path', ma.file_path,
              'file_name', ma.file_name,
              'file_size', ma.file_size,
              'mime_type', ma.mime_type
            )
          )
          FROM message_attachments ma
          WHERE ma.message_id = m.id
        ) AS attachments,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', mr.id,
              'user_id', mr.user_id,
              'reaction_type', mr.reaction_type,
              'created_at', mr.created_at
            )
          )
          FROM message_reactions mr
          WHERE mr.message_id = m.id
        ) AS reactions
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

      // Build query parameters based on whether a cursor is provided
      const params = cursor
        ? [conversationId, cursor, Number(limit)]
        : [conversationId, Number(limit)];

      const [messages] = await db.query(query, params);

      // If fetching older messages, reverse the array to maintain chronological order
      if (direction === "before") {
        messages.reverse();
      }

      const responsePayload = {
        messages,
        cursor: {
          next: messages.length ? messages[messages.length - 1].id : null,
          prev: messages.length ? messages[0].id : null,
        },
      };

      // Cache the response payload asynchronously (TTL is assumed to be set on the cache service)
      (async () => {
        try {
          await cache.set(
            `conversation:${conversationId}`,
            JSON.stringify(responsePayload)
          );
        } catch (err) {
          console.error(
            `Cache set error for conversation ${conversationId}:`,
            err
          );
        }
      })();

      res.json(responsePayload);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
}

export default MessageController;
