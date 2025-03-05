// server.js
import express from "express";
import http from "http";
import dotenv from "dotenv";
import corsMiddleware from "./src/middleware/corsMiddleware.js";
import staticMiddleware from "./src/middleware/staticMiddleware.js";
import dbMiddleware from "./src/middleware/dbMiddleware.js";
import productRoutes from "./src/routes/products.js";
import usersRouters from "./src/routes/users.js";
import searchRoutes from "./src/routes/search.js";
import paymentRoutes from "./src/routes/payments.js";
import categoriesRoutes from "./src/routes/categories.js";
import locationsRoutes from "./src/routes/locations.js";
import inquiriesRoutes from "./src/routes/inquiries.js";
import bankDetailsRoutes from "./src/routes/bankDetails.js";
import orderPaymentRoutes from "./src/routes/orderAndPayment.js";
import userstoreRoutes from "./src/routes/userstore.js";
import { initWebSocket } from "./src/services/websocketService.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.options("*", corsMiddleware);
app.use(express.json());
app.use("/uploads", staticMiddleware);

// Database Middleware
dbMiddleware(app);

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", usersRouters);
app.use("/api/search", searchRoutes);
app.use("/api/payment-methods", paymentRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/inquiries", inquiriesRoutes);
app.use("/api/bank-details", bankDetailsRoutes);
app.use("/api/order-pay", orderPaymentRoutes);
app.use("/api/userstores", userstoreRoutes);

// Create HTTP server and initialize WebSocket service
const server = http.createServer(app);
initWebSocket(server);

server.listen(port, () => {
  console.log(`shopMalawiBackEnd running on port ${port}`);
});
