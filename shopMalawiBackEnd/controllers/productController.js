import db from "../config/db.js";

// endpoint to get categories
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

// endpoint to add products
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

// Endpoint to get all products, optionally filtered by category and date range
export const getAllProducts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { categoryId, startDate, endDate } = req.query; // Get categoryId, startDate, and endDate from query parameters

    // Base query to get all products along with their images, category name, and uploaded_by username
    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.mark_up_amount, 
        p.category_id, 
        p.stock_quantity, 
        p.uploaded_by AS uploaded_by_userID, 
        u.username AS uploaded_by,
        pi.image_path, 
        pi.alt_text, 
        pi.is_primary,
        c.name AS category_name
      FROM 
        products p
      LEFT JOIN 
        product_images pi 
      ON 
        p.id = pi.product_id
      LEFT JOIN 
        categories c 
      ON 
        p.category_id = c.id
      LEFT JOIN 
        users u 
      ON 
        p.uploaded_by = u.id
    `;

    // Array to hold query parameters
    const queryParams = [];

    // Add WHERE clause if categoryId or date range is provided
    if (categoryId || startDate || endDate) {
      query += ` WHERE `;

      if (categoryId) {
        query += ` p.category_id = ? `;
        queryParams.push(categoryId);
      }

      if (categoryId && (startDate || endDate)) {
        query += ` AND `;
      }

      if (startDate && endDate) {
        query += ` DATE(p.created_at) BETWEEN ? AND ? `;
        queryParams.push(startDate, endDate);
      } else if (startDate) {
        query += ` DATE(p.created_at) >= ? `;
        queryParams.push(startDate);
      } else if (endDate) {
        query += ` DATE(p.created_at) <= ? `;
        queryParams.push(endDate);
      }
    }

    // Execute the query with optional parameters
    const [products] = await connection.query(query, queryParams);

    // Group images by product
    const productsWithImages = products.reduce((acc, product) => {
      const existingProduct = acc.find((p) => p.id === product.id);
      if (existingProduct) {
        existingProduct.images.push({
          image_path: product.image_path,
          alt_text: product.alt_text,
          is_primary: product.is_primary,
        });
      } else {
        acc.push({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          mark_up_amount: product.mark_up_amount,
          category_id: product.category_id,
          category: product.category_name, // Add category name to the response
          stock_quantity: product.stock_quantity,
          uploaded_by_userID: product.uploaded_by_userID, // Renamed field
          uploaded_by: product.uploaded_by, // Username of the user who uploaded the product
          images: product.image_path
            ? [
                {
                  image_path: product.image_path,
                  alt_text: product.alt_text,
                  is_primary: product.is_primary,
                },
              ]
            : [],
        });
      }
      return acc;
    }, []);

    res.status(200).json(productsWithImages);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  } finally {
    connection.release();
  }
};
