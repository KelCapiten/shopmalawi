// middleware/corsMiddleware.js
import cors from "cors";

const corsMiddleware = cors({
  origin: [
    "http://localhost:5173",
    // <--- Replace this with your actual dev tunnel origin(s)
    "https://68p2crb0-5173.uks1.devtunnels.ms/",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  // optionsSuccessStatus: 200 // Sometimes needed for older browsers
});

export default corsMiddleware;
