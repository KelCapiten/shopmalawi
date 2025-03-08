//services/ParticipantVerificationService.js
import db from "../config/db.js";

class ParticipantVerificationService {
  static async verifyParticipant(conversationId, userId, connection = db) {
    const query = `
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = ? AND user_id = ?
    `;

    const [result] = await connection.query(query, [conversationId, userId]);
    return result.length > 0;
  }

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
