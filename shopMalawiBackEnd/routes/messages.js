import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import MessagesController from "../controllers/MessagesController.js";
import {
  messageRateLimit,
  reactionRateLimit,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();
const messagesController = new MessagesController();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Search and Pagination routes
router.get("/search", messagesController.searchMessages);
router.get("/messageByCursor", messagesController.getMessagesByCursor);

// Bulk operations
router.post("/bulkMarkAsRead", messagesController.bulkMarkAsRead);

// Conversation routes - with explicit naming
router.get("/getAllConversations", messagesController.getConversations);
router.get("/getConversation/:id", messagesController.getConversation);
router.post("/createConversation", messagesController.createConversation);
router.delete(
  "/deleteConversation/:conversationId",
  messagesController.deleteConversation
);

// New metadata routes
router.put(
  "/updateMetadata/:conversationId",
  messagesController.updateConversationMetadata
);

// Message routes - with explicit naming
router.post("/sendMessage", messageRateLimit, messagesController.sendMessage);
router.post("/markMessageRead/:conversationId", messagesController.markAsRead);
router.delete("/deleteMessage/:messageId", messagesController.deleteMessage);
router.put("/editMessage/:messageId", messagesController.editMessage);

// Message status routes
router.put(
  "/updateDeliveryStatus/:messageId",
  messagesController.updateDeliveryStatus
);
router.get("/typingStatus/:conversationId", messagesController.getTypingStatus);
router.post(
  "/updateTypingStatus/:conversationId",
  messagesController.updateTypingStatus
);

// User presence routes
router.get("/userPresence", messagesController.getUserPresence);

// Reaction routes - with explicit naming
router.get(
  "/getMessageReactions/:messageId",
  messagesController.getMessageReactions
);
router.post(
  "/addReaction/:messageId",
  reactionRateLimit,
  messagesController.addReaction
);
router.delete("/removeReaction/:messageId", messagesController.removeReaction);

// Archive routes - with explicit naming
router.post(
  "/archiveConversation/:conversationId",
  messagesController.archiveConversation
);
router.post(
  "/unarchiveConversation/:conversationId",
  messagesController.unarchiveConversation
);

export default router;
