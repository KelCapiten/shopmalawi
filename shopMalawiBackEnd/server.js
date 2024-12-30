import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql";
import productRoutes from "./routes/products.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "shopMalawi",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// Attach MySQL connection to app locals
app.locals.db = db;

// Routes
app.use("/api/products", productRoutes);

// Start Server
app.listen(port, () => {
  console.log(`shopMalawiBackEnd running on port ${port}`);
});
