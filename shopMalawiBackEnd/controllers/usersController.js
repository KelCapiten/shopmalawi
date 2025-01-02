import jwt from "jsonwebtoken";
import db from "../config/db.js";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (req, res) => {
  const { username, firstName, lastName, password, phoneNumber } = req.body;

  if (!username || !firstName || !lastName || !password || !phoneNumber) {
    return res.status(400).json({ error: "All required fields are missing" });
  }

  try {
    const [roles] = await db.query("SELECT id FROM roles WHERE role_name = ?", [
      "customer",
    ]);
    if (roles.length === 0) {
      return res.status(500).json({ error: "Customer role not found" });
    }
    const customerRoleId = roles[0].id;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users 
       (username, first_name, last_name, email, password_hash, phone_number, location_id, role_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        firstName,
        lastName,
        "no-email@example.com",
        hashedPassword,
        phoneNumber,
        null,
        customerRoleId,
      ]
    );

    const token = jwt.sign(
      { id: result.insertId, username, role: "customer" },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.status(201).json({
      id: result.insertId,
      username,
      firstName,
      lastName,
      phoneNumber,
      role: "customer",
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const [roles] = await db.query("SELECT role_name FROM roles WHERE id = ?", [
      user.role_id,
    ]);
    if (roles.length === 0) {
      return res.status(500).json({ error: "Role not found" });
    }
    const role = roles[0].role_name;

    const token = jwt.sign(
      { id: user.id, username: user.username, role },
      JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.status(200).json({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number,
      role,
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Failed to log in user" });
  }
};
