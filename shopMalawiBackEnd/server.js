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
app.use(corsMiddleware); // Use CORS middleware
app.use(express.json()); // Parse JSON request bodies
app.use("/uploads", staticMiddleware); // Serve static files from the "uploads" directory

// Database Middleware
dbMiddleware(app); // Attach MySQL connection to app locals

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", usersRouters);

// Start Server
app.listen(port, () => {
  console.log(`shopMalawiBackEnd running on port ${port}`);
});
