import db from "../../../config/db.js";
import DbTransactionService from "../../../services/DbTransactionService.js";
import ErrorHandlingService from "../../../services/ErrorHandlingService.js";
import { uploadFile } from "../../../services/FileUploadService.js";
import { cache } from "../../config/cache.js";

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
          const [result] = await db.query(
            `INSERT INTO messages 
             (conversation_id, sender_id, text, forwarded_from, delivery_status) 
             VALUES (?, ?, ?, ?, 'sent')`,
            [convId, userId, message[0].text, messageId, "sent"]
          );

          // Update conversation last message
          await db.query(
            `UPDATE conversations 
             SET last_message_id = ?, updated_at = NOW() 
             WHERE id = ?`,
            [result.insertId, convId]
          );

          // Clear cache
          await cache.del(`conversation:${convId}`);

          return {
            conversationId: convId,
            success: true,
            messageId: result.insertId,
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

  // Get messages by cursor (pagination)
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
}

export default MessageController;
