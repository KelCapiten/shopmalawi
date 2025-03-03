import db from "../config/db.js";
import ErrorHandlingService from "../services/ErrorHandlingService.js";
import PaginationService from "../services/PaginationService.js";
import { cache } from "../config/cache.js";

class MessageReactionController {
  // Add reaction to message
  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body; // The emoji reaction (e.g., "👍", "❤️", "😂")
      const userId = req.user.id;

      // Validate emoji input using regex instead of fixed array
      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
      if (!emojiRegex.test(emoji)) {
        return res.status(400).json({ error: "Invalid emoji reaction" });
      }

      // Check if message exists and get conversation ID
      const [message] = await db.query(
        "SELECT conversation_id FROM messages WHERE id = ? AND deleted_at IS NULL",
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

      // Clear cache for this conversation
      const conversationId = message[0].conversation_id;
      await cache.del(`conversation:${conversationId}`);

      res.status(200).json({ success: true, reaction: emoji });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get reactions for a message with pagination
  async getMessageReactions(req, res) {
    try {
      const { messageId } = req.params;
      const paginationParams = PaginationService.getParams(req);

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
        [messageId, paginationParams.limit, paginationParams.offset]
      );

      // Get total count for pagination
      const [{ total }] = await db.query(
        `SELECT COUNT(*) as total FROM message_reactions WHERE message_id = ?`,
        [messageId]
      );

      const result = PaginationService.createResult(
        reactions,
        total,
        paginationParams
      );
      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Remove reaction from message
  async removeReaction(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      // Get conversation ID first for cache invalidation
      const [message] = await db.query(
        "SELECT conversation_id FROM messages WHERE id = ?",
        [messageId]
      );

      if (!message.length) {
        return res.status(404).json({ error: "Message not found" });
      }

      await db.query(
        `DELETE FROM message_reactions 
         WHERE message_id = ? AND user_id = ?`,
        [messageId, userId]
      );

      // Clear cache for this conversation
      const conversationId = message[0].conversation_id;
      await cache.del(`conversation:${conversationId}`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get users who reacted with a specific emoji
  async getUsersByReaction(req, res) {
    try {
      const { messageId, emoji } = req.params;
      const paginationParams = PaginationService.getParams(req);

      const [users] = await db.query(
        `SELECT 
          u.id, 
          u.username, 
          u.display_name,
          u.avatar_url,
          mr.created_at as reacted_at
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = ?
         AND mr.reaction_type = ?
         ORDER BY mr.created_at ASC
         LIMIT ? OFFSET ?`,
        [messageId, emoji, paginationParams.limit, paginationParams.offset]
      );

      // Get total count for pagination
      const [{ total }] = await db.query(
        `SELECT COUNT(*) as total 
         FROM message_reactions 
         WHERE message_id = ? AND reaction_type = ?`,
        [messageId, emoji]
      );

      const result = PaginationService.createResult(
        users,
        total,
        paginationParams
      );
      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
}

export default MessageReactionController;
