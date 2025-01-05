import express from "express";
import dotenv from "dotenv";
import corsMiddleware from "./middleware/corsMiddleware.js";
import staticMiddleware from "./middleware/staticMiddleware.js";
import dbMiddleware from "./middleware/dbMiddleware.js";
import productRoutes from "./routes/products.js";
import usersRouters from "./routes/users.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use("/uploads", staticMiddleware);

// Database Middleware
dbMiddleware(app);

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", usersRouters);

// Start Server
app.listen(port, () => {
  console.log(`shopMalawiBackEnd running on port ${port}`);
});
