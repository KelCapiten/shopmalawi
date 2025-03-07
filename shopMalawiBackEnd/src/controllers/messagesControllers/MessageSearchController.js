import db from "../../config/db.js";
import ErrorHandlingService from "../../services/ErrorHandlingService.js";
import PaginationService from "../../services/PaginationService.js";
import ParticipantVerificationService from "../../services/ParticipantVerificationService.js";

class MessageSearchController {
  // Add message search functionality
  async searchMessages(req, res) {
    try {
      const { conversationId, query } = req.query;
      const userId = req.user.id;
      const paginationParams = PaginationService.getParams(req);

      // First verify user is participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );

      if (!isParticipant) {
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
        paginationParams.limit,
        paginationParams.offset,
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

      const result = PaginationService.createResult(
        messages,
        total,
        paginationParams
      );
      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add message pagination with cursor
  async getMessagesByCursor(req, res) {
    try {
      const { conversationId } = req.query;
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

      // Get cursor pagination parameters
      const cursorParams = PaginationService.getCursorParams(req);

      // Build query conditions
      const operator = cursorParams.operator;
      const orderDir = cursorParams.orderDir;
      const { cursor, limit } = cursorParams;

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

      // Format results
      const result = PaginationService.createCursorResult(
        messages,
        cursorParams
      );

      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get message context (messages before and after a specific message)
  async getMessageContext(req, res) {
    try {
      const { messageId } = req.params;
      const { beforeCount = 5, afterCount = 5 } = req.query;
      const userId = req.user.id;

      // Get the target message and verify permissions
      const [message] = await db.query(
        `SELECT m.*, c.id as conversation_id 
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE m.id = ?`,
        [messageId]
      );

      if (!message.length) {
        return res.status(404).json({ error: "Message not found" });
      }

      const conversationId = message[0].conversation_id;

      // Verify user is participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );

      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get messages before the target
      const [messagesBefore] = await db.query(
        `SELECT m.*, 
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'avatar', u.avatar_url
                ) as sender
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         AND m.deleted_at IS NULL
         AND m.created_at < (SELECT created_at FROM messages WHERE id = ?)
         ORDER BY m.created_at DESC
         LIMIT ?`,
        [conversationId, messageId, Number(beforeCount)]
      );

      // Get messages after the target
      const [messagesAfter] = await db.query(
        `SELECT m.*, 
                JSON_OBJECT(
                  'id', u.id,
                  'username', u.username,
                  'avatar', u.avatar_url
                ) as sender
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.conversation_id = ?
         AND m.deleted_at IS NULL
         AND m.created_at > (SELECT created_at FROM messages WHERE id = ?)
         ORDER BY m.created_at ASC
         LIMIT ?`,
        [conversationId, messageId, Number(afterCount)]
      );

      // Return all messages in chronological order
      const result = {
        before: messagesBefore.reverse(),
        target: message[0],
        after: messagesAfter,
      };

      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
}

export default MessageSearchController;
