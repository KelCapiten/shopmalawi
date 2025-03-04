import db from "../config/db.js";
import ErrorHandlingService from "../services/ErrorHandlingService.js";
import ParticipantVerificationService from "../services/ParticipantVerificationService.js";
import PaginationService from "../services/PaginationService.js";
import { cache } from "../config/cache.js";

class ConversationMetadataController {
  // Get conversation metadata
  async getMetadata(req, res) {
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
          .json({ error: "Not authorized to view this conversation" });
      }

      const [metadata] = await db.query(
        `SELECT 
          cm.*, 
          u.username as creator_name,
          u.avatar_url as creator_avatar,
          COUNT(DISTINCT cp.user_id) as participant_count
        FROM conversation_metadata cm
        JOIN conversation_participants cp ON cm.conversation_id = cp.conversation_id
        LEFT JOIN users u ON cm.created_by = u.id
        WHERE cm.conversation_id = ?
        GROUP BY cm.conversation_id`,
        [conversationId]
      );

      if (!metadata.length) {
        return res
          .status(404)
          .json({ error: "Conversation metadata not found" });
      }

      res.json(metadata[0]);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Update conversation metadata
  async updateMetadata(req, res) {
    try {
      const { conversationId } = req.params;
      const { title, description, isGroup, avatarUrl } = req.body;
      const userId = req.user.id;

      // Verify participant and permission (only creator can update)
      const [metadata] = await db.query(
        `SELECT created_by FROM conversation_metadata WHERE conversation_id = ?`,
        [conversationId]
      );

      if (!metadata.length) {
        return res
          .status(404)
          .json({ error: "Conversation metadata not found" });
      }

      if (metadata[0].created_by !== userId) {
        return res
          .status(403)
          .json({ error: "Only the conversation creator can update metadata" });
      }

      // Update metadata
      await db.query(
        `UPDATE conversation_metadata 
         SET 
           title = COALESCE(?, title),
           description = COALESCE(?, description),
           is_group = COALESCE(?, is_group),
           avatar_url = COALESCE(?, avatar_url),
           updated_at = NOW()
         WHERE conversation_id = ?`,
        [title, description, isGroup, avatarUrl, conversationId]
      );

      // Clear cache
      await cache.del(`conversation:${conversationId}`);
      await cache.del(`conversations:${userId}*`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get conversation participants
  async getParticipants(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const paginationParams = PaginationService.getParams(req);

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

      // Get participants count
      const [{ total }] = await db.query(
        `SELECT COUNT(*) as total 
         FROM conversation_participants 
         WHERE conversation_id = ?`,
        [conversationId]
      );

      // Get participants with user details
      const [participants] = await db.query(
        `SELECT 
          cp.user_id,
          cp.joined_at,
          cp.is_admin,
          cp.last_read_at,
          cp.is_archived,
          cp.is_pinned,
          u.username,
          u.avatar_url,
          u.email,
          COALESCE(up.status, 'offline') as status,
          up.last_active
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN user_presence up ON u.id = up.user_id
        WHERE cp.conversation_id = ?
        ORDER BY cp.joined_at ASC
        LIMIT ? OFFSET ?`,
        [conversationId, paginationParams.limit, paginationParams.offset]
      );

      const result = PaginationService.createResult(
        participants,
        total,
        paginationParams
      );
      res.json(result);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Add participant to conversation
  async addParticipant(req, res) {
    try {
      const { conversationId } = req.params;
      const { userId: newUserId, isAdmin = false } = req.body;
      const userId = req.user.id;

      // Verify requester is participant and admin
      const [requesterInfo] = await db.query(
        `SELECT is_admin FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!requesterInfo.length || !requesterInfo[0].is_admin) {
        return res
          .status(403)
          .json({ error: "Only admins can add participants" });
      }

      // Verify conversation is group
      const [metadata] = await db.query(
        `SELECT is_group FROM conversation_metadata WHERE conversation_id = ?`,
        [conversationId]
      );

      if (!metadata.length || !metadata[0].is_group) {
        return res.status(400).json({
          error: "Only group conversations can have participants added",
        });
      }

      // Check if user is already a participant
      const [existingParticipant] = await db.query(
        `SELECT 1 FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, newUserId]
      );

      if (existingParticipant.length) {
        return res.status(400).json({ error: "User is already a participant" });
      }

      // Add participant
      await db.query(
        `INSERT INTO conversation_participants 
         (conversation_id, user_id, is_admin, joined_at) 
         VALUES (?, ?, ?, NOW())`,
        [conversationId, newUserId, isAdmin]
      );

      // Add system message
      const [userData] = await db.query(
        `SELECT username FROM users WHERE id = ?`,
        [newUserId]
      );

      const systemMessage = `${userData[0].username} was added to the conversation`;

      await db.query(
        `INSERT INTO messages 
         (conversation_id, text, is_system_message, created_at) 
         VALUES (?, ?, TRUE, NOW())`,
        [conversationId, systemMessage]
      );

      // Clear cache
      await cache.del(`conversation:${conversationId}`);
      await cache.del(`conversations:${newUserId}*`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Remove participant from conversation
  async removeParticipant(req, res) {
    try {
      const { conversationId, participantId } = req.params;
      const userId = req.user.id;

      // Verify requester is participant and admin
      const [requesterInfo] = await db.query(
        `SELECT is_admin FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!requesterInfo.length || !requesterInfo[0].is_admin) {
        return res
          .status(403)
          .json({ error: "Only admins can remove participants" });
      }

      // Verify conversation is group
      const [metadata] = await db.query(
        `SELECT is_group FROM conversation_metadata WHERE conversation_id = ?`,
        [conversationId]
      );

      if (!metadata.length || !metadata[0].is_group) {
        return res.status(400).json({
          error: "Only group conversations can have participants removed",
        });
      }

      // Check if the participant is the creator
      const [creatorInfo] = await db.query(
        `SELECT created_by FROM conversation_metadata WHERE conversation_id = ?`,
        [conversationId]
      );

      if (creatorInfo[0].created_by === participantId) {
        return res
          .status(400)
          .json({ error: "Cannot remove the conversation creator" });
      }

      // Remove participant
      await db.query(
        `DELETE FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, participantId]
      );

      // Add system message
      const [userData] = await db.query(
        `SELECT username FROM users WHERE id = ?`,
        [participantId]
      );

      const systemMessage = `${userData[0].username} was removed from the conversation`;

      await db.query(
        `INSERT INTO messages 
         (conversation_id, text, is_system_message, created_at) 
         VALUES (?, ?, TRUE, NOW())`,
        [conversationId, systemMessage]
      );

      // Clear cache
      await cache.del(`conversation:${conversationId}`);
      await cache.del(`conversations:${participantId}*`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Update participant admin status
  async updateParticipantRole(req, res) {
    try {
      const { conversationId, participantId } = req.params;
      const { isAdmin } = req.body;
      const userId = req.user.id;

      // Verify requester is participant and admin
      const [requesterInfo] = await db.query(
        `SELECT is_admin FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      if (!requesterInfo.length || !requesterInfo[0].is_admin) {
        return res
          .status(403)
          .json({ error: "Only admins can update participant roles" });
      }

      // Check if the target is the creator
      const [creatorInfo] = await db.query(
        `SELECT created_by FROM conversation_metadata WHERE conversation_id = ?`,
        [conversationId]
      );

      if (creatorInfo[0].created_by === participantId) {
        return res
          .status(400)
          .json({ error: "Cannot modify the role of conversation creator" });
      }

      // Update participant role
      await db.query(
        `UPDATE conversation_participants 
         SET is_admin = ?
         WHERE conversation_id = ? AND user_id = ?`,
        [isAdmin, conversationId, participantId]
      );

      // Add system message
      const [userData] = await db.query(
        `SELECT username FROM users WHERE id = ?`,
        [participantId]
      );

      const systemMessage = `${userData[0].username} was ${
        isAdmin ? "promoted to admin" : "removed as admin"
      }`;

      await db.query(
        `INSERT INTO messages 
         (conversation_id, text, is_system_message, created_at) 
         VALUES (?, ?, TRUE, NOW())`,
        [conversationId, systemMessage]
      );

      // Clear cache
      await cache.del(`conversation:${conversationId}`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Leave conversation
  async leaveConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Check if the leaving user is the creator
      const [creatorInfo] = await db.query(
        `SELECT created_by FROM conversation_metadata WHERE conversation_id = ?`,
        [conversationId]
      );

      if (creatorInfo[0].created_by === userId) {
        // Get next admin to transfer ownership
        const [nextAdmin] = await db.query(
          `SELECT user_id FROM conversation_participants 
           WHERE conversation_id = ? AND user_id != ? AND is_admin = TRUE
           ORDER BY joined_at ASC LIMIT 1`,
          [conversationId, userId]
        );

        if (nextAdmin.length) {
          // Transfer ownership
          await db.query(
            `UPDATE conversation_metadata 
             SET created_by = ? 
             WHERE conversation_id = ?`,
            [nextAdmin[0].user_id, conversationId]
          );
        } else {
          // Get any participant to transfer ownership
          const [anyParticipant] = await db.query(
            `SELECT user_id FROM conversation_participants 
             WHERE conversation_id = ? AND user_id != ?
             ORDER BY joined_at ASC LIMIT 1`,
            [conversationId, userId]
          );

          if (anyParticipant.length) {
            // Transfer ownership and make admin
            await db.query(
              `UPDATE conversation_metadata 
               SET created_by = ? 
               WHERE conversation_id = ?`,
              [anyParticipant[0].user_id, conversationId]
            );

            await db.query(
              `UPDATE conversation_participants 
               SET is_admin = TRUE
               WHERE conversation_id = ? AND user_id = ?`,
              [conversationId, anyParticipant[0].user_id]
            );
          } else {
            // Last participant, delete conversation
            await db.query(
              `UPDATE conversations 
               SET deleted_at = NOW() 
               WHERE id = ?`,
              [conversationId]
            );

            await db.query(
              `DELETE FROM conversation_participants 
               WHERE conversation_id = ? AND user_id = ?`,
              [conversationId, userId]
            );

            // Clear cache
            await cache.del(`conversation:${conversationId}`);
            await cache.del(`conversations:${userId}*`);

            return res.json({ success: true, deleted: true });
          }
        }
      }

      // Remove participant
      await db.query(
        `DELETE FROM conversation_participants 
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      // Add system message
      const [userData] = await db.query(
        `SELECT username FROM users WHERE id = ?`,
        [userId]
      );

      const systemMessage = `${userData[0].username} left the conversation`;

      await db.query(
        `INSERT INTO messages 
         (conversation_id, text, is_system_message, created_at) 
         VALUES (?, ?, TRUE, NOW())`,
        [conversationId, systemMessage]
      );

      // Clear cache
      await cache.del(`conversation:${conversationId}`);
      await cache.del(`conversations:${userId}*`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Update conversation settings
  async updateSettings(req, res) {
    try {
      const { conversationId } = req.params;
      const {
        muteNotifications,
        themeColor,
        customNickname,
        showReadReceipts,
        allowReplies,
        priorityLevel,
      } = req.body;
      const userId = req.user.id;

      // Verify participant
      const isParticipant =
        await ParticipantVerificationService.verifyParticipant(
          conversationId,
          userId
        );

      if (!isParticipant) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this conversation" });
      }

      // Update user-specific conversation settings
      await db.query(
        `INSERT INTO conversation_user_settings
         (conversation_id, user_id, mute_notifications, theme_color, custom_nickname, 
          show_read_receipts, allow_replies, priority_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         mute_notifications = COALESCE(?, mute_notifications),
         theme_color = COALESCE(?, theme_color),
         custom_nickname = COALESCE(?, custom_nickname),
         show_read_receipts = COALESCE(?, show_read_receipts),
         allow_replies = COALESCE(?, allow_replies),
         priority_level = COALESCE(?, priority_level)`,
        [
          conversationId,
          userId,
          muteNotifications,
          themeColor,
          customNickname,
          showReadReceipts,
          allowReplies,
          priorityLevel,
          muteNotifications,
          themeColor,
          customNickname,
          showReadReceipts,
          allowReplies,
          priorityLevel,
        ]
      );

      // Clear cache
      await cache.del(`conversation:${conversationId}`);
      await cache.del(`conversations:${userId}*`);

      res.json({ success: true });
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }

  // Get conversation settings
  async getSettings(req, res) {
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
          .json({ error: "Not authorized to view this conversation" });
      }

      const [settings] = await db.query(
        `SELECT * FROM conversation_user_settings
         WHERE conversation_id = ? AND user_id = ?`,
        [conversationId, userId]
      );

      const defaultSettings = {
        mute_notifications: false,
        theme_color: "default",
        custom_nickname: null,
        show_read_receipts: true,
        allow_replies: true,
        priority_level: "normal",
      };

      res.json(settings.length ? settings[0] : defaultSettings);
    } catch (error) {
      ErrorHandlingService.handleError(error, res);
    }
  }
}

export default ConversationMetadataController;
