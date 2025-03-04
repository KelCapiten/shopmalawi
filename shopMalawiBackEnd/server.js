//server.js
import express from "express";
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
import { createServer } from "http";
import { configureSocket } from "./src/config/WebSocketService.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = configureSocket(httpServer);

const port = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.options("*", corsMiddleware);
app.use(express.json());
app.use("/uploads", staticMiddleware);

// Make io available in req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

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

// Start Server
httpServer.listen(port, () => {
  console.log(`shopMalawiBackEnd running on port ${port}`);
});
