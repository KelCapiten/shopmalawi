// controllers/userstoreController.js
import db from "../config/db.js";

// Endpoint to add a store
export const addStore = async (req, res) => {
  const {
    brand_name,
    tagline,
    description,
    banner_url,
    profile_picture_url,
    owner_id,
    is_active,
  } = req.body;

  try {
    if (!brand_name || brand_name.trim() === "") {
      return res.status(400).json({ message: "Store brand name is required" });
    }

    if (!owner_id) {
      return res.status(400).json({ message: "Owner ID is required" });
    }

    // Check if the owner exists
    const [ownerCheck] = await db.query("SELECT id FROM users WHERE id = ?", [
      owner_id,
    ]);
    if (ownerCheck.length === 0) {
      return res.status(400).json({ message: "Owner does not exist" });
    }

    // Insert the new store record, defaulting is_active to true if not provided
    const [result] = await db.query(
      "INSERT INTO stores (brand_name, tagline, description, banner_url, profile_picture_url, owner_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        brand_name,
        tagline || null,
        description || null,
        banner_url || null,
        profile_picture_url || null,
        owner_id,
        typeof is_active === "boolean" ? is_active : true,
      ]
    );

    res.status(201).json({
      message: "Store added successfully",
      store: {
        id: result.insertId,
        brand_name,
        tagline,
        description,
        banner_url,
        profile_picture_url,
        owner_id,
        is_active: typeof is_active === "boolean" ? is_active : true,
      },
    });
  } catch (error) {
    console.error("Error adding store:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Store brand name already exists" });
    }
    res.status(500).json({ message: "Failed to add store" });
  }
};

// Endpoint to update a store
export const updateStore = async (req, res) => {
  const { id } = req.params;
  const {
    brand_name,
    tagline,
    description,
    banner_url,
    profile_picture_url,
    is_active,
  } = req.body;

  try {
    if (!id || !brand_name) {
      return res
        .status(400)
        .json({ message: "Store ID and brand name are required" });
    }

    const [result] = await db.query(
      "UPDATE stores SET brand_name = ?, tagline = ?, description = ?, banner_url = ?, profile_picture_url = ?, is_active = ? WHERE id = ?",
      [
        brand_name,
        tagline || null,
        description || null,
        banner_url || null,
        profile_picture_url || null,
        typeof is_active === "boolean" ? is_active : true,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Store not found or no changes made" });
    }

    res.status(200).json({ message: "Store updated successfully" });
  } catch (error) {
    console.error("Error updating store:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Store brand name already exists" });
    }
    res.status(500).json({ message: "Failed to update store" });
  }
};

// Endpoint to get store details
export const getStore = async (req, res) => {
  // Optionally filter by store id or owner_id passed as query parameters
  const { id, owner_id } = req.query;
  try {
    if (id) {
      const [rows] = await db.query("SELECT * FROM stores WHERE id = ?", [id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Store not found" });
      }
      return res.status(200).json({ store: rows[0] });
    } else if (owner_id) {
      const [rows] = await db.query("SELECT * FROM stores WHERE owner_id = ?", [
        owner_id,
      ]);
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No stores found for the specified owner" });
      }
      return res.status(200).json({ stores: rows });
    } else {
      // If no filters are provided, return all stores
      const [rows] = await db.query("SELECT * FROM stores");
      return res.status(200).json({ stores: rows });
    }
  } catch (error) {
    console.error("Error fetching store details:", error);
    res.status(500).json({ message: "Failed to get store details" });
  }
};
