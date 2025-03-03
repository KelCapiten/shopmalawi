// Create a new file: services/ParticipantVerificationService.js
import db from "../config/db.js";

class ParticipantVerificationService {
  /**
   * Verifies if a user is a participant in a conversation
   * @param {number} conversationId - The conversation ID
   * @param {number} userId - The user ID to verify
   * @param {object} connection - Optional DB connection for transaction support
   * @returns {Promise<boolean>} - True if participant, false otherwise
   */
  static async verifyParticipant(conversationId, userId, connection = db) {
    const query = `
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ?
    `;

    const [result] = await connection.query(query, [conversationId, userId]);
    return result.length > 0;
  }

  /**
   * Express middleware to verify conversation participant
   * @param {string} paramName - URL param name containing conversation ID (default: 'conversationId')
   */
  static middleware(paramName = "conversationId") {
    return async (req, res, next) => {
      try {
        const conversationId = req.params[paramName] || req.body.conversationId;
        const userId = req.user.id;

        if (!conversationId) {
          return res.status(400).json({ error: "Conversation ID is required" });
        }

        const isParticipant = await this.verifyParticipant(
          conversationId,
          userId
        );

        if (!isParticipant) {
          return res.status(403).json({
            error: "Not authorized to access this conversation",
          });
        }

        next();
      } catch (error) {
        console.error("Participant verification error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }
}

export default ParticipantVerificationService;
