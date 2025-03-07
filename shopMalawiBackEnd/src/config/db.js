import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Create a connection pool to handle multiple requests efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Limit the number of concurrent connections
  queueLimit: 0,
});

// Export the pool to be used in other parts of the application
const db = pool.promise();

db.getConnection()
  .then(() => console.log("Connected to the MySQL database successfully"))
  .catch((err) => console.error("Database connection failed:", err.message));

export default db;
