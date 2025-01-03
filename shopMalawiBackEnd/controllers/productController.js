import db from "../config/db.js";

export const getCategories = async (req, res) => {
  try {
    // Fetch all categories with their parent_id
    const [categories] = await db.query(
      "SELECT id, name, description, parent_id FROM categories"
    );

    // Organize categories into a hierarchical structure
    const categoryMap = new Map();
    const rootCategories = [];

    // Create a map of categories
    categories.forEach((category) => {
      categoryMap.set(category.id, { ...category, subcategories: [] });
    });

    // Build the hierarchy
    categories.forEach((category) => {
      if (category.parent_id) {
        const parentCategory = categoryMap.get(category.parent_id);
        if (parentCategory) {
          parentCategory.subcategories.push(categoryMap.get(category.id));
        }
      } else {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    res.status(200).json(rootCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const addProduct = async (req, res) => {
  const { name, description, price, categoryId, stockQuantity } = req.body;

  if (!name || !description || !price || !req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "All required fields and at least one image are necessary.",
    });
  }

  const uploadedBy = req.user.id;
  const markUpAmount = parseFloat(price) * 0.1;

  const connection = await db.getConnection();
  try {
    // Start transaction
    await connection.beginTransaction();

    // Insert product
    const [productResult] = await connection.query(
      `INSERT INTO products (name, description, price, mark_up_amount, category_id, stock_quantity, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        markUpAmount,
        categoryId,
        stockQuantity,
        uploadedBy,
      ]
    );

    const productId = productResult.insertId;

    // Modify file paths and insert into product_images table
    const imageQueries = req.files.map((file, index) => {
      // Modify the file path for the database
      const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;

      return connection.query(
        `INSERT INTO product_images (product_id, image_path, alt_text, is_primary) VALUES (?, ?, ?, ?)`,
        [productId, modifiedFilePath, null, index === 0]
      );
    });

    await Promise.all(imageQueries);

    // Commit transaction
    await connection.commit();

    res.status(201).json({ message: "Product added successfully", productId });
  } catch (error) {
    console.error("Error adding product:", error);

    // Rollback transaction on error
    await connection.rollback();

    res.status(500).json({ message: "Failed to add product" });
  } finally {
    connection.release();
  }
};

// New endpoint to get products added today
export const getProductsAddedToday = async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Fetch products created today
    const [products] = await db.query(
      `SELECT 
         p.id, 
         p.name, 
         p.description, 
         p.price, 
         p.mark_up_amount, 
         p.category_id, 
         p.stock_quantity, 
         p.uploaded_by, 
         p.created_at, 
         p.updated_at, 
         pi.image_path AS primary_image 
       FROM products p 
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1 
       WHERE DATE(p.created_at) = ?`,
      [today]
    );

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products added today:", error);
    res.status(500).json({ message: "Failed to fetch products added today" });
  }
};
