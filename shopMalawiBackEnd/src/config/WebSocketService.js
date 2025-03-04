import { Server } from "socket.io";
import jwt from "jsonwebtoken";

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      // Add authentication middleware for WebSocket connections
      async beforeConnect(auth, next) {
        try {
          const token = auth.token;
          if (!token) {
            return next(new Error("Authentication token is required"));
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          auth.userId = decoded.id;
          next();
        } catch (error) {
          console.error("WebSocket authentication error:", error);
          next(new Error("Invalid or expired token"));
        }
      },
    });

    this.setupEventHandlers();
    return this.io;
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // User is already authenticated through the beforeConnect middleware
      const userId = socket.handshake.auth.userId;
      this.connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Handle message sending
      socket.on("send_message", ({ recipientId, message, conversationId }) => {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("receive_message", {
            senderId: socket.userId,
            message,
            conversationId,
          });
        }
      });

      // Handle typing indicators
      socket.on("typing_start", ({ conversationId, recipientId }) => {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("typing_indicator", {
            userId: socket.userId,
            conversationId,
            isTyping: true,
          });
        }
      });

      socket.on("typing_end", ({ conversationId, recipientId }) => {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("typing_indicator", {
            userId: socket.userId,
            conversationId,
            isTyping: false,
          });
        }
      });

      // Handle message status updates
      socket.on("message_status", ({ messageId, status, recipientId }) => {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("message_status_update", {
            messageId,
            status,
            userId: socket.userId,
          });
        }
      });

      // Handle message reactions
      socket.on("message_reaction", ({ messageId, reaction, recipientId }) => {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("message_reaction_update", {
            messageId,
            reaction,
            userId: socket.userId,
          });
        }
      });

      // Handle notifications
      socket.on("notification", ({ type, data, recipientId }) => {
        const recipientSocketId = this.connectedUsers.get(recipientId);
        if (recipientSocketId) {
          this.io.to(recipientSocketId).emit("notification", { type, data });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
        console.log("Client disconnected:", socket.id);
      });
    });
  }

  // Utility methods for emitting events
  emitToUser(userId, eventName, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(eventName, data);
      return true;
    }
    return false;
  }

  broadcastToAll(eventName, data, exceptUserId = null) {
    if (exceptUserId) {
      const socketId = this.connectedUsers.get(exceptUserId);
      this.io.except(socketId).emit(eventName, data);
    } else {
      this.io.emit(eventName, data);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if a user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

// Create and export a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;
