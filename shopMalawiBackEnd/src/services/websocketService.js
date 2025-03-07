// src/services/websocketService.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ConversationController from "../controllers/messagesControllers/ConversationController.js";
import MessageController from "../controllers/messagesControllers/MessageController.js";
import db from "../config/db.js";

const conversationController = new ConversationController();
const messageController = new MessageController();

// Inactivity timeout in milliseconds (e.g., 5 minutes)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const initWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://192.168.1.173:8100"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token is required"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Invalid or expired token", error));
    }
  });

  setTimeout(() => {
    const address = server.address();
    if (address) {
      console.log("Server address:", address);
    } else {
      console.log("WebSocket Server address is not available yet.");
    }
  }, 1000);

  console.log("WebSocket is attached to the HTTP server.");

  io.on("connection", async (socket) => {
    console.log(`Client connected: ${socket.id}, user: ${socket.user.id}`);

    // Track last activity time for this socket
    socket.lastActivity = Date.now();
    // Update last activity on relevant events
    const updateActivity = () => {
      socket.lastActivity = Date.now();
    };

    // Join the user to all their active conversation rooms on connect
    try {
      const [conversations] = await db.query(
        "SELECT conversation_id FROM conversation_participants WHERE user_id = ? AND is_archived = FALSE",
        [socket.user.id]
      );
      conversations.forEach((conv) => {
        const roomName = `conversation-${conv.conversation_id}`;
        socket.join(roomName);
        console.log(
          `User ${socket.user.id} joined room ${roomName} on connect`
        );
      });
    } catch (error) {
      console.error("Error joining rooms on connect:", error);
    }

    // Check for inactivity every minute
    const inactivityCheck = setInterval(() => {
      const timeSinceLastActivity = Date.now() - socket.lastActivity;
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log(
          `Closing inactive socket: ${socket.id}, user: ${socket.user.id}`
        );
        socket.disconnect(true); // Force disconnect
      }
    }, 60 * 1000); // Check every minute

    // Listen for "startConversation" events
    socket.on("startConversation", async (data) => {
      if (!socket.user || !socket.user.id) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }
      try {
        const req = {
          body: {
            participantIds: data.participantIds,
            initialMessage: data.initialMessage,
            title: data.title,
            description: data.description,
            isGroup: data.isGroup,
          },
          user: { id: socket.user.id },
        };

        const res = {
          status: (code) => ({
            json: async (result) => {
              if (code === 201 && result && result.id) {
                const roomName = `conversation-${result.id}`;

                const [participants] = await db.query(
                  "SELECT user_id FROM conversation_participants WHERE conversation_id = ?",
                  [result.id]
                );

                participants.forEach((participant) => {
                  const participantSocket = Array.from(
                    io.sockets.sockets.values()
                  ).find((s) => s.user && s.user.id === participant.user_id);
                  if (
                    participantSocket &&
                    !participantSocket.rooms.has(roomName)
                  ) {
                    participantSocket.join(roomName);
                    console.log(
                      `User ${participant.user_id} joined room ${roomName}`
                    );
                  }
                });

                socket.emit("conversationStarted", { id: result.id });
                updateActivity();
              } else {
                socket.emit("error", {
                  message: "Failed to create conversation",
                });
              }
            },
          }),
        };

        await conversationController.createConversation(req, res);
      } catch (error) {
        console.error("Error starting conversation:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Listen for "sendMessage" events
    socket.on("sendMessage", async (data) => {
      if (!socket.user || !socket.user.id) {
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
          user: { id: socket.user.id },
          files: data.files,
        };

        const roomName = `conversation-${req.body.conversationId}`;

        const [participants] = await db.query(
          "SELECT user_id FROM conversation_participants WHERE conversation_id = ?",
          [req.body.conversationId]
        );

        participants.forEach((participant) => {
          const participantSocket = Array.from(
            io.sockets.sockets.values()
          ).find((s) => s.user && s.user.id === participant.user_id);
          if (participantSocket && !participantSocket.rooms.has(roomName)) {
            participantSocket.join(roomName);
            console.log(`User ${participant.user_id} joined room ${roomName}`);
          }
        });

        const res = {
          status: () => ({
            json: (result) => {
              if (result && result.messageId) {
                const emitPayload = {
                  conversationId: req.body.conversationId,
                  text: req.body.text,
                  parentMessageId: req.body.parentMessageId,
                  sender_id: socket.user.id,
                  messageId: result.messageId,
                  created_at: new Date(),
                  delivery_status: "sent",
                };

                io.to(roomName).emit("newMessage", emitPayload);
                socket.emit("messageSent", { messageId: result.messageId });
                updateActivity();
              }
            },
          }),
        };

        await messageController.sendMessage(req, res);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Clean up interval on disconnect
    socket.on("disconnect", () => {
      clearInterval(inactivityCheck);
      console.log(`Client disconnected: ${socket.id}, user: ${socket.user.id}`);
    });
  });
};
