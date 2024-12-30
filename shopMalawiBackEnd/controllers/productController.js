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
  const { name, description, price, category } = req.body;

  // Check if an image was uploaded
  if (!req.file) {
    return res.status(400).json({ error: "Image is required" });
  }

  // Read the image file as a binary buffer
  const image = req.file.buffer;

  try {
    const [result] = await db.query(
      "INSERT INTO products (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)",
      [name, description, price, category, image]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      price,
      category,
      image: `data:image/png;base64,${image.toString("base64")}`, // Return the image as a base64 string (optional)
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Failed to add product" });
  }
};
