import cors from "cors";

const corsMiddleware = cors({
  origin: [
    "http://localhost:5173",
    "http://192.168.1.173:8100",
    "https://68p2crb0-5173.uks1.devtunnels.ms",
    "https://68p2crb0-1994.uks1.devtunnels.ms",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

export default corsMiddleware;
