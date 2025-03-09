// controllers/usersController.js
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

// Endpoint to register a new user
export const registerUser = async (req, res) => {
  const {
    username,
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    locationId,
  } = req.body;
  // Remove email from required fields; generate dummy if missing
  if (!username || !firstName || !lastName || !password || !phoneNumber) {
    return res.status(400).json({ error: "All required fields are missing" });
  }
  // Generate a unique dummy email when not provided: no-email_(firstname)@example.com
  const finalEmail = email ? email : `no-email_${firstName}@example.com`;
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
       (username, first_name, last_name, email, password_hash, phone_number, verified, location_id, role_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        firstName,
        lastName,
        finalEmail,
        hashedPassword,
        phoneNumber,
        false,
        locationId || null,
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
      email: finalEmail,
      phoneNumber,
      verified: false,
      locationId: locationId || null,
      role: "customer",
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Username, email, or phone number already exists" });
    }
    res.status(500).json({ error: "Failed to register user" });
  }
};

// Endpoint to update user info (requires authentication)
export const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, phoneNumber, locationId } = req.body;
    if (
      !firstName &&
      !lastName &&
      !email &&
      !phoneNumber &&
      locationId === undefined
    ) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const fields = [];
    const values = [];
    if (firstName) {
      fields.push("first_name = ?");
      values.push(firstName);
    }
    if (lastName) {
      fields.push("last_name = ?");
      values.push(lastName);
    }
    if (email) {
      fields.push("email = ?");
      values.push(email);
    }
    if (phoneNumber) {
      fields.push("phone_number = ?");
      values.push(phoneNumber);
    }
    if (locationId !== undefined) {
      fields.push("location_id = ?");
      values.push(locationId);
    }
    values.push(userId);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await db.query(query, values);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "User not found or no changes made" });
    }
    const [users] = await db.query(
      "SELECT id, username, first_name, last_name, email, phone_number, verified, location_id, role_id FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found after update" });
    }
    const user = users[0];
    const [roles] = await db.query("SELECT role_name FROM roles WHERE id = ?", [
      user.role_id,
    ]);
    const role = roles.length ? roles[0].role_name : "unknown";
    let location = null;
    if (user.location_id) {
      const [locations] = await db.query(
        "SELECT name FROM locations WHERE id = ?",
        [user.location_id]
      );
      if (locations.length) {
        location = locations[0].name;
      }
    }
    res.status(200).json({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone_number,
      verified: user.verified,
      locationId: user.location_id,
      location,
      role,
    });
  } catch (error) {
    console.error("Error updating user info:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ error: "Username, email, or phone number already exists" });
    }
    res.status(500).json({ error: "Failed to update user info" });
  }
};

// Endpoint to login a user
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
      email: user.email,
      phoneNumber: user.phone_number,
      verified: user.verified,
      locationId: user.location_id,
      role,
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Failed to log in user" });
  }
};

// Endpoint to get all users
export const getUsers = async (req, res) => {
  let authenticatedUser = null;
  let authUserRole = null;
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const [userResult] = await db.query(
        "SELECT id, role_id FROM users WHERE id = ?",
        [decoded.id]
      );
      if (userResult.length > 0) {
        authenticatedUser = userResult[0];
        const [roleResult] = await db.query(
          "SELECT role_name FROM roles WHERE id = ?",
          [authenticatedUser.role_id]
        );
        if (roleResult.length > 0) {
          authUserRole = roleResult[0].role_name;
        }
      }
    } catch (error) {
      void error;
    }
  }
  try {
    const [users] = await db.query(
      `SELECT 
         u.id,
         u.username,
         u.first_name,
         u.last_name,
         u.email,
         u.phone_number,
         u.verified,
         u.location_id,
         u.role_id,
         r.role_name,
         l.name AS location_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN locations l ON u.location_id = l.id`
    );
    let resultUsers;
    if (!authenticatedUser) {
      resultUsers = users.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
      }));
    } else if (authUserRole && authUserRole.toLowerCase() === "admin") {
      resultUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        verified: user.verified,
        locationId: user.location_id,
        role: user.role_name,
        location: user.location_name,
      }));
    } else {
      resultUsers = users.map((user) =>
        user.id === authenticatedUser.id
          ? {
              id: user.id,
              username: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              phoneNumber: user.phone_number,
              verified: user.verified,
              locationId: user.location_id,
              role: user.role_name,
              location: user.location_name,
            }
          : {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
            }
      );
    }
    return res.status(200).json(resultUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Endpoint to get user info (optional authentication)
export const getUserInfo = async (req, res) => {
  let authenticatedUser = null;
  let authUserRole = null;
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const [userResult] = await db.query(
        "SELECT id, role_id FROM users WHERE id = ?",
        [decoded.id]
      );
      if (userResult.length > 0) {
        authenticatedUser = userResult[0];
        const [roleResult] = await db.query(
          "SELECT role_name FROM roles WHERE id = ?",
          [authenticatedUser.role_id]
        );
        if (roleResult.length > 0) {
          authUserRole = roleResult[0].role_name;
        }
      }
    } catch (error) {
      void error;
    }
  }
  let requestedUserId = req.query.id;
  if (!requestedUserId && authenticatedUser) {
    requestedUserId = authenticatedUser.id;
  }
  if (!requestedUserId) {
    return res
      .status(400)
      .json({ error: "User ID required when not authenticated" });
  }
  try {
    const [users] = await db.query(
      "SELECT id, username, first_name, last_name, email, phone_number, verified, location_id, role_id, profile_picture_id FROM users WHERE id = ?",
      [requestedUserId]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];
    // Fetch the profile picture if available
    let profilePictureUrl = null;
    if (user.profile_picture_id) {
      const [profilePicRows] = await db.query(
        "SELECT image_path FROM images WHERE id = ?",
        [user.profile_picture_id]
      );
      if (profilePicRows.length) {
        profilePictureUrl = profilePicRows[0].image_path;
      }
    }
    // Full user info for admin or self
    if (
      authenticatedUser &&
      ((authUserRole && authUserRole.toLowerCase() === "admin") ||
        requestedUserId == authenticatedUser.id)
    ) {
      const [roles] = await db.query(
        "SELECT role_name FROM roles WHERE id = ?",
        [user.role_id]
      );
      const roleName = roles.length ? roles[0].role_name : "unknown";
      let location = null;
      if (user.location_id) {
        const [locations] = await db.query(
          "SELECT name FROM locations WHERE id = ?",
          [user.location_id]
        );
        if (locations.length) {
          location = locations[0].name;
        }
      }
      const userInfo = {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        verified: user.verified,
        locationId: user.location_id,
        role: roleName,
        location: location,
        profilePictureUrl,
      };
      return res.status(200).json(userInfo);
    } else {
      // Public info
      const publicInfo = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePictureUrl,
      };
      return res.status(200).json(publicInfo);
    }
  } catch (error) {
    console.error("Error getting user info:", error);
    return res.status(500).json({ error: "Failed to fetch user info" });
  }
};
