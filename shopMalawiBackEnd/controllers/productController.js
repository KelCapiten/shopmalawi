import db from "../config/db.js";

export const addProduct = async (req, res) => {
  const { name, description, price, category, created_at } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  const images = req.files.map((file) => file.buffer);

  try {
    const [result] = await db.query(
      "INSERT INTO products (name, description, price, category, created_at, images) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, price, category, created_at, JSON.stringify(images)]
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
      ),
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Failed to add product" });
  }
};

export const getNewlyAddedProducts = async (req, res) => {
  const { limit = 5, offset = 0 } = req.query;

  try {
    const today = new Date().toISOString().split("T")[0];

    const [rows] = await db.query(
      "SELECT * FROM products WHERE DATE(created_at) = ? LIMIT ? OFFSET ?",
      [today, parseInt(limit), parseInt(offset)]
    );

    const products = rows.map((product) => {
      const images =
        typeof product.images === "string"
          ? JSON.parse(product.images)
          : product.images;
      return {
        ...product,
        images: images.map(
          (image) =>
            `data:image/png;base64,${Buffer.from(image).toString("base64")}`
        ),
      };
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching newly added products:", error);
    res.status(500).json({ message: "Failed to fetch newly added products" });
  }
};
