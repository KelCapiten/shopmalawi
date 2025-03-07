//src/routes/messages.js
import express from "express";
import {
  ConversationController,
  MessageController,
  MessageReactionController,
  MessageStatusController,
  MessageSearchController,
  ConversationMetadataController,
} from "../controllers/messagesControllers/MessagesIndex.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Initialize controllers
const conversationController = new ConversationController();
const messageController = new MessageController();
const messageReactionController = new MessageReactionController();
const messageStatusController = new MessageStatusController();
const messageSearchController = new MessageSearchController();
const conversationMetadataController = new ConversationMetadataController();

// Conversation routes
router.post(
  "/createConversation",
  authenticateUser,
  conversationController.createConversation
);
router.get(
  "/getConversationsList",
  authenticateUser,
  conversationController.getConversationsList
);
router.get(
  "/getConversation/:id",
  authenticateUser,
  conversationController.getConversation
);
router.put(
  "/updateConversationMetadata/:id",
  authenticateUser,
  conversationController.updateConversationMetadata
);
router.delete(
  "/deleteConversation/:id",
  authenticateUser,
  conversationController.deleteConversation
);

// Message routes
router.post(
  "/sendMessage",
  authenticateUser,
  upload.array("files"),
  messageController.sendMessage
);
router.get(
  "/getMessages/:conversationId",
  authenticateUser,
  messageController.getMessagesByCursor
);
router.put("/editMessage/:id", authenticateUser, messageController.editMessage);
router.delete(
  "/deleteMessage/:id",
  authenticateUser,
  messageController.deleteMessage
);

// Conversation metadata routes
router.get(
  "/getConversationMetadata/:conversationId",
  authenticateUser,
  conversationMetadataController.getMetadata
);
router.put(
  "/updateConversationMetadata/:conversationId",
  authenticateUser,
  conversationMetadataController.updateMetadata
);
router.get(
  "/getConversationParticipants/:conversationId",
  authenticateUser,
  conversationMetadataController.getParticipants
);
router.post(
  "/addParticipant/:conversationId",
  authenticateUser,
  conversationMetadataController.addParticipant
);
router.delete(
  "/removeParticipant/:conversationId/:participantId",
  authenticateUser,
  conversationMetadataController.removeParticipant
);
router.put(
  "/updateParticipantRole/:conversationId/:participantId",
  authenticateUser,
  conversationMetadataController.updateParticipantRole
);
router.post(
  "/leaveConversation/:conversationId",
  authenticateUser,
  conversationMetadataController.leaveConversation
);
router.put(
  "/updateConversationSettings/:conversationId",
  authenticateUser,
  conversationMetadataController.updateSettings
);
router.get(
  "/getConversationSettings/:conversationId",
  authenticateUser,
  conversationMetadataController.getSettings
);

// Message reactions routes
router.post(
  "/addMessageReaction/:messageId",
  authenticateUser,
  messageReactionController.addReaction
);
router.get(
  "/getMessageReactions/:messageId",
  authenticateUser,
  messageReactionController.getMessageReactions
);
router.delete(
  "/removeMessageReaction/:messageId/:reactionId",
  authenticateUser,
  messageReactionController.removeReaction
);

// Message status routes
router.put(
  "/updateTypingStatus/:conversationId",
  authenticateUser,
  messageStatusController.updateTypingStatus
);

router.get(
  "/getTypingStatus/:conversationId",
  authenticateUser,
  messageStatusController.getTypingStatus
);

router.put(
  "/updateDeliveryStatus/:messageId",
  authenticateUser,
  messageStatusController.updateDeliveryStatus
);

router.post(
  "/addReadReceipt/:messageId",
  authenticateUser,
  messageStatusController.addReadReceipt
);

router.get(
  "/getReadReceipts/:messageId",
  authenticateUser,
  messageStatusController.getReadReceipts
);

router.put(
  "/bulkMarkAsRead",
  authenticateUser,
  messageStatusController.bulkMarkAsRead
);

router.get(
  "/getMessageStatus/:messageId",
  authenticateUser,
  messageStatusController.getMessageStatus
);

// Message search routes
router.get(
  "/searchMessages",
  authenticateUser,
  messageSearchController.searchMessages
);

export default router;
