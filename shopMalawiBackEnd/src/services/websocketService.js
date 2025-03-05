// src/services/websocketService.js
import { Server } from "socket.io";
import ConversationController from "../controllers/messagesControllers/ConversationController.js";
import MessageController from "../controllers/messagesControllers/MessageController.js";

const conversationController = new ConversationController();
const messageController = new MessageController();

export const initWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://192.168.1.173:8100"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const connectedUsers = new Map(); // Track connected users

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // User authentication and tracking
    socket.on("authenticate", (userId) => {
      connectedUsers.set(socket.id, userId);
      socket.userId = userId;
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
    });

    // Client joins a conversation room
    socket.on("joinConversation", async (conversationId) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      try {
        // Get conversation messages using ConversationController
        const req = {
          params: { id: conversationId },
          user: { id: socket.userId },
        };
        const res = {
          json: (data) => {
            socket.join(`conversation-${conversationId}`);
            console.log(
              `Socket ${socket.id} joined conversation-${conversationId}`
            );
            socket.emit("conversationHistory", data);
          },
          status: () => res,
        };

        await conversationController.getConversation(req, res);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Listen for a new message
    socket.on("sendMessage", async (data) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      try {
        const req = {
          body: {
            conversationId: data.conversationId,
            text: data.content,
            parentMessageId: data.parentMessageId,
          },
          user: { id: socket.userId },
          files: data.files,
        };

        const res = {
          status: () => res,
          json: (result) => {
            const messageId = result.messageId;
            // Emit the new message to all clients in the conversation room
            io.to(`conversation-${data.conversationId}`).emit("newMessage", {
              id: messageId,
              conversation_id: data.conversationId,
              sender_id: socket.userId,
              text: data.content,
              created_at: new Date(),
              delivery_status: "sent",
            });

            // Confirm message delivery to sender
            socket.emit("messageSent", { messageId });
          },
        };

        await messageController.sendMessage(req, res);
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle message read status
    socket.on("markAsRead", async (messageId) => {
      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      try {
        const req = {
          params: { messageId },
          user: { id: socket.userId },
        };

        const res = {
          json: () => {
            socket.emit("messageMarkedAsRead", { messageId });
          },
        };

        await messageController.updateReadReceipt(req, res);
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      if (socket.userId) {
        connectedUsers.delete(socket.id);
      }
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
