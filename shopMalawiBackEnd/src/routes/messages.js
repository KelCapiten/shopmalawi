import express from "express";
import {
  ConversationController,
  MessageController,
  MessageReactionController,
  MessageStatusController,
  MessageSearchController,
} from "../../controllers/messagesControllers/MessagesIndex.js";
import { authenticateToken } from "../../middleware/authMiddleware.js";
import { upload } from "../middleware/fileUploadMiddleware.js";

const router = express.Router();

// Initialize controllers
const conversationController = new ConversationController();
const messageController = new MessageController();
const messageReactionController = new MessageReactionController();
const messageStatusController = new MessageStatusController();
const messageSearchController = new MessageSearchController();

// Conversation routes
router.post(
  "/conversations",
  authenticateToken,
  conversationController.createConversation
);
router.get(
  "/conversations",
  authenticateToken,
  conversationController.getUserConversations
);
router.get(
  "/conversations/:id",
  authenticateToken,
  conversationController.getConversationById
);
router.put(
  "/conversations/:id",
  authenticateToken,
  conversationController.updateConversation
);
router.delete(
  "/conversations/:id",
  authenticateToken,
  conversationController.deleteConversation
);

// Message routes
router.post(
  "/messages",
  authenticateToken,
  upload.array("files"),
  messageController.sendMessage
);
router.get(
  "/messages/:conversationId",
  authenticateToken,
  messageController.getMessages
);
router.put("/messages/:id", authenticateToken, messageController.editMessage);
router.delete(
  "/messages/:id",
  authenticateToken,
  messageController.deleteMessage
);

// Message reactions routes
router.post(
  "/messages/:messageId/reactions",
  authenticateToken,
  messageReactionController.addReaction
);
router.get(
  "/messages/:messageId/reactions",
  authenticateToken,
  messageReactionController.getMessageReactions
);
router.delete(
  "/messages/:messageId/reactions/:reactionId",
  authenticateToken,
  messageReactionController.removeReaction
);

// Message status routes
router.put(
  "/messages/:messageId/status",
  authenticateToken,
  messageStatusController.updateMessageStatus
);
router.get(
  "/messages/:messageId/status",
  authenticateToken,
  messageStatusController.getMessageStatus
);

// Message search routes
router.get(
  "/search",
  authenticateToken,
  messageSearchController.searchMessages
);

export default router;
