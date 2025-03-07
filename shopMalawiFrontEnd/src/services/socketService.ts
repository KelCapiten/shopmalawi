// src/services/socketService.ts
import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:1994"; // Adjust if needed

// Initialize the socket connection
const socket: Socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"], // ensure the use of WebSocket transport
});

// Optional: listen for connection confirmation
socket.on("connect", () => {
  console.log("Connected to WebSocket server with id:", socket.id);
});

// Export the socket instance for use in components
export default socket;
