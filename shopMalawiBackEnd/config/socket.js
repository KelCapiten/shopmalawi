import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function configureSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://192.168.1.173:8100",
        "https://68p2crb0-5173.uks1.devtunnels.ms",
        "https://68p2crb0-1994.uks1.devtunnels.ms",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.id);

    // Join user's personal room
    socket.join(`user:${socket.user.id}`);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.id);
    });
  });

  return io;
}
