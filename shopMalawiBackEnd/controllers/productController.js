import db from "../config/db.js";

// Get All Products
export const getProducts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a Product
export const addProduct = async (req, res) => {
  const { name, description, price, category, created_at } = req.body;

  // Check if images were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  // Read the image files as binary buffers
  const images = req.files.map((file) => file.buffer);

  try {
    // Insert the product into the database
    const [result] = await db.query(
      "INSERT INTO products (name, description, price, category, created_at, images) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, price, category, created_at, JSON.stringify(images)] // Store images as a JSON array
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      price,
      category,
      created_at,
      images: images.map(
        (image) => `data:image/png;base64,${image.toString("base64")}`
      ), // Return images as base64 strings
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Failed to add product" });
  }
};
