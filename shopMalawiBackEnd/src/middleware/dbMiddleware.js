import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const dbMiddleware = (app) => {
  db.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL database:", err);
    } else {
      console.log("Connected to MySQL database");
    }
  });

  // Attach MySQL connection to app locals
  app.locals.db = db;
};

export default dbMiddleware;
