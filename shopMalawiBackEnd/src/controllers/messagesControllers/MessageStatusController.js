import db from "../config/db.js";
import ErrorHandlingService from "../services/ErrorHandlingService.js";
import { cache } from "../config/cache.js";
import ParticipantVerificationService from "../services/ParticipantVerificationService.js";

class MessageStatusController {
  // Update typing status
  async updateTypingStatus(req, res) {
    try {
      const { conversationId } = req.params;
      const { isTyping } = req.body;
      const userId = req.user.id;

      // Verify participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );

      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

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
      const userId = req.user.id;

      // Verify participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );

      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

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
      const { status } = req.body; // 'sent', 'delivered', or 'failed'
      const userId = req.user.id;

      // Verify sender owns the message
      const [message] = await db.query(
        `SELECT conversation_id FROM messages WHERE id = ? AND sender_id = ?`,
        [messageId, userId]
      );

      if (!message.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this message status" });
      }

      await db.query(
        `UPDATE messages 
         SET delivery_status = ?, 
             delivered_at = CASE WHEN ? = 'delivered' THEN NOW() ELSE delivered_at END
         WHERE id = ?`,
        [status, status, messageId]
      );

      // Clear conversation cache
      await cache.del(`conversation:${message[0].conversation_id}`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add read receipt for a message
  async addReadReceipt(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      // Get conversation ID from message to verify participant
      const [message] = await db.query(
        `SELECT conversation_id FROM messages WHERE id = ?`,
        [messageId]
      );

      if (!message.length) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Verify participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          message[0].conversation_id,
          userId
        );

      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

      await db.query(
        `INSERT INTO message_read_receipts (message_id, user_id, read_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE read_at = NOW()`,
        [messageId, userId]
      );

      // Update last_read_at in conversation_participants
      await db.query(
        `UPDATE conversation_participants 
         SET last_read_at = NOW() 
         WHERE conversation_id = ? AND user_id = ?`,
        [message[0].conversation_id, userId]
      );

      // Clear conversation cache
      await cache.del(`conversation:${message[0].conversation_id}`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get read receipts for a message
  async getReadReceipts(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      // Get conversation ID from message to verify participant
      const [message] = await db.query(
        `SELECT conversation_id, sender_id FROM messages WHERE id = ?`,
        [messageId]
      );

      if (!message.length) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Verify participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          message[0].conversation_id,
          userId
        );

      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const [readReceipts] = await db.query(
        `SELECT mrr.user_id, mrr.read_at, u.username, u.avatar_url
         FROM message_read_receipts mrr
         JOIN users u ON mrr.user_id = u.id
         WHERE mrr.message_id = ?
         ORDER BY mrr.read_at ASC`,
        [messageId]
      );

      res.json({ readReceipts });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Bulk update read status for multiple messages
  async bulkMarkAsRead(req, res) {
    try {
      const { messageIds } = req.body;
      const userId = req.user.id;

      // First verify user is participant in all conversations
      const [validMessages] = await db.query(
        `
        SELECT DISTINCT m.id, m.conversation_id 
        FROM messages m
        JOIN conversation_participants cp 
          ON m.conversation_id = cp.conversation_id
        WHERE m.id IN (?) 
        AND cp.user_id = ?
        `,
        [messageIds, userId]
      );

      const validIds = validMessages.map((m) => m.id);
      const conversationIds = [
        ...new Set(validMessages.map((m) => m.conversation_id)),
      ];

      if (validIds.length > 0) {
        // Insert read receipts for all valid messages
        const values = validIds.map((id) => [id, userId]);

        await db.query(
          `
          INSERT INTO message_read_receipts (message_id, user_id, read_at)
          VALUES ?
          ON DUPLICATE KEY UPDATE read_at = NOW()
          `,
          [values]
        );

        // Update last_read_at for affected conversations
        for (const convId of conversationIds) {
          await db.query(
            `
            UPDATE conversation_participants
            SET last_read_at = NOW()
            WHERE conversation_id = ?
            AND user_id = ?
            `,
            [convId, userId]
          );

          // Clear conversation cache
          await cache.del(`conversation:${convId}`);
        }
      }

      res.json({ success: true, messagesUpdated: validIds.length });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get message delivery status
  async getMessageStatus(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      // Get message and verify sender
      const [message] = await db.query(
        `SELECT m.*, 
                COUNT(DISTINCT mrr.user_id) as read_count,
                COUNT(DISTINCT cp.user_id) - 1 as total_recipients
         FROM messages m
         JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
         LEFT JOIN message_read_receipts mrr ON m.id = mrr.message_id
         WHERE m.id = ? AND m.sender_id = ?
         GROUP BY m.id`,
        [messageId, userId]
      );

      if (!message.length) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this message status" });
      }

      // Get read receipts details
      const [readBy] = await db.query(
        `SELECT u.id, u.username, u.avatar_url, mrr.read_at
         FROM message_read_receipts mrr
         JOIN users u ON mrr.user_id = u.id
         WHERE mrr.message_id = ?
         ORDER BY mrr.read_at ASC`,
        [messageId]
      );

      res.json({
        id: message[0].id,
        status: message[0].delivery_status,
        sent_at: message[0].created_at,
        delivered_at: message[0].delivered_at,
        read_by: readBy,
        read_count: message[0].read_count,
        total_recipients: message[0].total_recipients,
      });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
}

export default MessageStatusController;
