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
    category_id, // new field
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

    // Insert the new store record including category_id
    const [result] = await db.query(
      "INSERT INTO stores (brand_name, tagline, description, banner_url, profile_picture_url, owner_id, is_active, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        brand_name,
        tagline || null,
        description || null,
        banner_url || null,
        profile_picture_url || null,
        owner_id,
        typeof is_active === "boolean" ? is_active : true,
        category_id || null, // pass null if not provided
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
        category_id: category_id || null,
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
  const { brand_name, tagline, description, is_active, category_id } = req.body;

  if (!id || !brand_name) {
    return res
      .status(400)
      .json({ message: "Store ID and brand name are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let banner_url = req.body.banner_url || null;
    let profile_picture_url = req.body.profile_picture_url || null;

    if (req.files) {
      if (req.files.banner && req.files.banner[0]) {
        banner_url = "/" + req.files.banner[0].path.replace(/\\/g, "/");
      }
      if (req.files.profile && req.files.profile[0]) {
        profile_picture_url =
          "/" + req.files.profile[0].path.replace(/\\/g, "/");
      }
    }

    const [result] = await connection.query(
      "UPDATE stores SET brand_name = ?, tagline = ?, description = ?, banner_url = ?, profile_picture_url = ?, is_active = ?, category_id = ? WHERE id = ?",
      [
        brand_name,
        tagline || null,
        description || null,
        banner_url,
        profile_picture_url,
        typeof is_active === "boolean" ? is_active : true,
        category_id || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Store not found or no changes made" });
    }

    const [updatedStoreRows] = await connection.query(
      "SELECT * FROM stores WHERE id = ?",
      [id]
    );

    await connection.commit();
    res
      .status(200)
      .json({
        message: "Store updated successfully",
        store: updatedStoreRows[0],
      });
  } catch (error) {
    console.error("Error updating store:", error);
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Store brand name already exists" });
    }
    res.status(500).json({ message: "Failed to update store" });
  } finally {
    connection.release();
  }
};

// Endpoint to get store details
export const getStore = async (req, res) => {
  const { id, owner_id } = req.query;
  try {
    let rows = [];
    if (id) {
      const [result] = await db.query("SELECT * FROM stores WHERE id = ?", [
        id,
      ]);
      rows = result;
    } else if (owner_id) {
      const [result] = await db.query(
        "SELECT * FROM stores WHERE owner_id = ?",
        [owner_id]
      );
      rows = result;
    } else {
      const [result] = await db.query("SELECT * FROM stores");
      rows = result;
    }
    // Return the array of store objects (empty if none are found)
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching store details:", error);
    res.status(500).json([]);
  }
};

// Endpoint to delete a store
export const deleteStore = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the store exists
    const [rows] = await db.query("SELECT * FROM stores WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }
    // Delete the store
    await db.query("DELETE FROM stores WHERE id = ?", [id]);
    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ message: "Failed to delete store" });
  }
};

// Endpoint to add a product to a store
export const addProductToStore = async (req, res) => {
  const { store_id, product_id } = req.body;
  try {
    if (!store_id || !product_id) {
      return res
        .status(400)
        .json({ message: "store_id and product_id are required" });
    }
    // Verify the store exists
    const [storeRows] = await db.query("SELECT id FROM stores WHERE id = ?", [
      store_id,
    ]);
    if (storeRows.length === 0) {
      return res.status(404).json({ message: "Store not found" });
    }
    // Verify the product exists
    const [productRows] = await db.query(
      "SELECT id FROM products WHERE id = ?",
      [product_id]
    );
    if (productRows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Insert into the join table (assumes a many-to-many relationship)
    await db.query(
      "INSERT INTO product_stores (product_id, store_id) VALUES (?, ?)",
      [product_id, store_id]
    );
    res.status(201).json({ message: "Product added to store successfully" });
  } catch (error) {
    console.error("Error adding product to store:", error);
    res.status(500).json({ message: "Failed to add product to store" });
  }
};
