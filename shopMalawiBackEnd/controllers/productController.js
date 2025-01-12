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

export const getAllProducts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { categoryId, startDate, endDate } = req.query; // Extract query parameters

    // Base SQL query to retrieve products along with related data
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
        c.name AS category_name,
        p.created_at
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

    // Array to hold parameterized query values
    const queryParams = [];

    // Initialize an array to build WHERE conditions
    const whereConditions = [];

    if (categoryId) {
      // Convert categoryId to a number for safety
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        return res
          .status(400)
          .json({ message: "Invalid categoryId parameter" });
      }

      // Check if the provided categoryId is a parent category
      const [categoryRows] = await connection.query(
        `SELECT id FROM categories WHERE id = ? AND EXISTS (SELECT 1 FROM categories WHERE parent_id = ?)`,
        [parsedCategoryId, parsedCategoryId]
      );

      if (categoryRows.length > 0) {
        // **Parent Category:** Fetch all subcategory IDs
        const [subRows] = await connection.query(
          `SELECT id FROM categories WHERE parent_id = ?`,
          [parsedCategoryId]
        );

        const subcategoryIds = subRows.map((row) => row.id);

        if (subcategoryIds.length > 0) {
          // Add condition to filter products belonging to any of the subcategory IDs
          // AND products directly under the parent category
          const placeholders = subcategoryIds.map(() => "?").join(",");
          whereConditions.push(
            `(p.category_id = ? OR p.category_id IN (${placeholders}))`
          );
          queryParams.push(parsedCategoryId, ...subcategoryIds);
        } else {
          // **No Subcategories:** Include products directly under the parent category
          whereConditions.push(`p.category_id = ?`);
          queryParams.push(parsedCategoryId);
        }
      } else {
        // **Subcategory:** Directly filter products by the provided categoryId
        whereConditions.push(`p.category_id = ?`);
        queryParams.push(parsedCategoryId);
      }
    }

    // Handle date range filtering if provided
    if (startDate && endDate) {
      whereConditions.push(`DATE(p.created_at) BETWEEN ? AND ?`);
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereConditions.push(`DATE(p.created_at) >= ?`);
      queryParams.push(startDate);
    } else if (endDate) {
      whereConditions.push(`DATE(p.created_at) <= ?`);
      queryParams.push(endDate);
    }

    // Append WHERE clause if there are any conditions
    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(" AND ");
    }

    // Append ORDER BY clause to sort results by creation date in descending order
    query += ` ORDER BY p.created_at DESC`;

    // Execute the final query with all parameters
    const [products] = await connection.query(query, queryParams);

    // Process the fetched products to group images by product
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
          category: product.category_name, // Include category name
          stock_quantity: product.stock_quantity,
          uploaded_by_userID: product.uploaded_by_userID, // Renamed field
          uploaded_by: product.uploaded_by, // Username of the uploader
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

    // Send the processed products as a JSON response
    res.status(200).json(productsWithImages);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  } finally {
    // Always release the database connection back to the pool
    connection.release();
  }
};

// endpoint to get a product by ID
export const getProductById = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // Validate the product ID
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Query to fetch the product by ID along with related data
    const query = `
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
        c.name AS category_name,
        p.created_at
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
      WHERE 
        p.id = ?
    `;

    // Execute the query
    const [products] = await connection.query(query, [parsedId]);

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Process the fetched product to group images
    const product = products.reduce((acc, item) => {
      if (!acc) {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          mark_up_amount: item.mark_up_amount,
          category_id: item.category_id,
          category: item.category_name,
          stock_quantity: item.stock_quantity,
          uploaded_by_userID: item.uploaded_by_userID,
          uploaded_by: item.uploaded_by,
          images: item.image_path
            ? [
                {
                  image_path: item.image_path,
                  alt_text: item.alt_text,
                  is_primary: item.is_primary,
                },
              ]
            : [],
        };
      }

      acc.images.push({
        image_path: item.image_path,
        alt_text: item.alt_text,
        is_primary: item.is_primary,
      });

      return acc;
    }, null);

    // Send the product as a JSON response
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  } finally {
    // Release the database connection
    connection.release();
  }
};
