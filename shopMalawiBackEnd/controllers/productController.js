//controllers/productController.js
import db from "../config/db.js";

// endpoint to add products
export const addProduct = async (req, res) => {
  const { name, description, price, category_id, stockQuantity } = req.body;

  // Basic validation
  if (!name || !description || !price || !req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "All required fields and at least one image are necessary.",
    });
  }

  const uploadedBy = req.user.id;
  const markUpAmount = parseFloat(price) * 0.1;

  const connection = await db.getConnection();
  try {
    // 1) Fetch category info
    const [categoryInfo] = await connection.query(
      `SELECT 
         c1.name AS category_name, 
         c1.id AS category_id,
         c1.parent_id,
         c2.name AS maincategory_name, 
         c2.id AS maincategory_id
       FROM categories c1
       LEFT JOIN categories c2 ON c1.parent_id = c2.id
       WHERE c1.id = ?`,
      [category_id]
    );

    if (categoryInfo.length === 0) {
      return res.status(400).json({ message: "Invalid category_id" });
    }

    const { category_name, parent_id, maincategory_id, maincategory_name } =
      categoryInfo[0];

    // Determine if the category is a main category or subcategory
    const isMainCategory = parent_id === null;

    // 2) Start transaction
    await connection.beginTransaction();

    // 3) Insert product into `products` table
    const [productResult] = await connection.query(
      `INSERT INTO products 
       (name, description, price, mark_up_amount, 
        subcategory_id, subcategory_name, 
        maincategory_id, maincategory_name, 
        stock_quantity, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        markUpAmount,
        isMainCategory ? category_id : category_id, // subcategory_id
        isMainCategory ? category_name : category_name, // subcategory_name
        isMainCategory ? category_id : maincategory_id, // maincategory_id
        isMainCategory ? category_name : maincategory_name, // maincategory_name
        stockQuantity,
        uploadedBy,
      ]
    );

    const productId = productResult.insertId;

    // 4) Insert images into `images` table (polymorphic approach)
    const imageQueries = req.files.map((file, index) => {
      const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
      return connection.query(
        `INSERT INTO images 
         (imageable_id, imageable_type, image_path, alt_text, is_primary) 
         VALUES (?, 'products', ?, ?, ?)`,
        [productId, modifiedFilePath, null, index === 0]
      );
    });

    await Promise.all(imageQueries);

    // 5) Commit transaction
    await connection.commit();

    res.status(201).json({ message: "Product added successfully", productId });
  } catch (error) {
    console.error("Error adding product:", error);
    // Rollback on error
    await connection.rollback();
    res.status(500).json({ message: "Failed to add product" });
  } finally {
    connection.release();
  }
};

// endpoint to get all products with optional filters
export const getAllProducts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      category_id,
      startDate,
      endDate,
      groupBy,
      uploaded_by,
      includeInactive,
      store_id, // new query parameter
    } = req.query;

    // Base SQL query: note we join on `images i` for product images.
    // When store_id is provided, we add an INNER JOIN on product_stores.
    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price,
        p.subcategory_id, 
        p.subcategory_name, 
        p.maincategory_id, 
        p.maincategory_name, 
        p.stock_quantity, 
        p.is_active,
        p.uploaded_by AS uploaded_by_userID, 
        u.username AS uploaded_by,
        i.image_path, 
        i.alt_text, 
        i.is_primary,
        ${store_id ? "ps.isSellerPick as isSellerPick," : ""}
        p.created_at
      FROM products p
      LEFT JOIN users u
        ON p.uploaded_by = u.id
      LEFT JOIN images i
        ON i.imageable_id = p.id
        AND i.imageable_type = 'products'
    `;

    // If store_id is provided, join with product_stores to filter by store.
    const queryParams = [];
    if (store_id) {
      query += ` INNER JOIN product_stores ps ON p.id = ps.product_id `;
    }

    const whereConditions = [];

    // Determine if category_id is a main category or subcategory
    let isMainCategory = false;
    let categoryName = null;
    if (category_id) {
      const [category] = await connection.query(
        `SELECT name, parent_id FROM categories WHERE id = ?`,
        [category_id]
      );
      if (category.length > 0) {
        isMainCategory = category[0].parent_id === null;
        categoryName = category[0].name;
      }
    }

    // Filter by store_id if provided.
    if (store_id) {
      whereConditions.push(`ps.store_id = ?`);
      queryParams.push(parseInt(store_id, 10));
    }

    // Filter by category_id
    if (category_id) {
      if (isMainCategory) {
        // If it's a main category, include all products in its subcategories
        whereConditions.push(`
          (p.maincategory_id = ? 
            OR p.subcategory_id IN (
              SELECT id FROM categories WHERE parent_id = ?
            )
          )`);
        queryParams.push(parseInt(category_id, 10), parseInt(category_id, 10));
      } else {
        // If it's a subcategory, include only products in that subcategory
        whereConditions.push(`p.subcategory_id = ?`);
        queryParams.push(parseInt(category_id, 10));
      }
    }

    // Filter by date range if provided
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

    // Filter by uploaded_by if provided
    if (uploaded_by) {
      whereConditions.push(`p.uploaded_by = ?`);
      queryParams.push(parseInt(uploaded_by, 10));
    }

    // By default, include only active products unless includeInactive is explicitly set to "true"
    if (!includeInactive || includeInactive !== "true") {
      whereConditions.push(`p.is_active = true`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ` + whereConditions.join(" AND ");
    }

    // Sort by newest
    query += ` ORDER BY p.created_at DESC`;

    // Execute query
    const [products] = await connection.query(query, queryParams);

    // Group multiple image rows under each product
    const productsWithImages = products.reduce((acc, product) => {
      const existingProduct = acc.find((p) => p.id === product.id);
      if (existingProduct) {
        if (product.image_path) {
          existingProduct.images.push({
            image_path: product.image_path,
            alt_text: product.alt_text,
            is_primary: product.is_primary,
          });
        }
      } else {
        const newProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          subcategory_id: product.subcategory_id,
          subcategory_name: product.subcategory_name,
          maincategory_id: product.maincategory_id,
          maincategory_name: product.maincategory_name,
          stock_quantity: product.stock_quantity,
          is_active: product.is_active,
          uploaded_by_userID: product.uploaded_by_userID,
          uploaded_by: product.uploaded_by,
          created_at: product.created_at,
          images: product.image_path
            ? [
                {
                  image_path: product.image_path,
                  alt_text: product.alt_text,
                  is_primary: product.is_primary,
                },
              ]
            : [],
        };
        if (store_id) {
          newProduct.isSellerPick = product.isSellerPick;
        }
        acc.push(newProduct);
      }
      return acc;
    }, []);

    let response;

    // If category_id is provided
    if (category_id) {
      if (groupBy === "maincategory") {
        // Group by main category
        const categories = {};
        productsWithImages.forEach((product) => {
          if (!categories[product.maincategory_id]) {
            categories[product.maincategory_id] = {
              id: product.maincategory_id,
              name: product.maincategory_name,
              products: [],
            };
          }
          categories[product.maincategory_id].products.push(product);
        });
        response = Object.values(categories);
      } else if (groupBy === "subcategory") {
        // Group by subcategory
        const categories = {};
        productsWithImages.forEach((product) => {
          if (!categories[product.subcategory_id]) {
            categories[product.subcategory_id] = {
              id: product.subcategory_id,
              name: product.subcategory_name,
              products: [],
            };
          }
          categories[product.subcategory_id].products.push(product);
        });
        response = Object.values(categories);
      } else {
        // No grouping, return in the specified format
        response = [
          {
            id: parseInt(category_id, 10),
            name: categoryName,
            products: productsWithImages,
          },
        ];
      }
    } else {
      // No category_id filtering
      let groupedProducts = [];

      if (groupBy === "maincategory") {
        const catMap = {};
        productsWithImages.forEach((product) => {
          if (!catMap[product.maincategory_id]) {
            catMap[product.maincategory_id] = {
              id: product.maincategory_id,
              name: product.maincategory_name,
              products: [],
            };
          }
          catMap[product.maincategory_id].products.push(product);
        });
        groupedProducts = Object.values(catMap);
      } else if (groupBy === "subcategory") {
        const catMap = {};
        productsWithImages.forEach((product) => {
          if (!catMap[product.subcategory_id]) {
            catMap[product.subcategory_id] = {
              id: product.subcategory_id,
              name: product.subcategory_name,
              products: [],
            };
          }
          catMap[product.subcategory_id].products.push(product);
        });
        groupedProducts = Object.values(catMap);
      } else {
        // No grouping
        groupedProducts = productsWithImages;
      }

      response = groupedProducts;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  } finally {
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

    // Updated query: LEFT JOIN on `images` table, matching `imageable_id` and `imageable_type`
    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.mark_up_amount,
        p.subcategory_id,
        p.subcategory_name,
        p.maincategory_id,
        p.maincategory_name,
        p.stock_quantity,
        p.uploaded_by AS uploaded_by_userID,
        u.username AS uploaded_by,
        i.image_path,
        i.alt_text,
        i.is_primary,
        p.created_at
      FROM products p
      LEFT JOIN users u 
        ON p.uploaded_by = u.id
      LEFT JOIN images i
        ON i.imageable_id = p.id
        AND i.imageable_type = 'products'
      WHERE p.id = ?
    `;

    // Execute the query
    const [rows] = await connection.query(query, [parsedId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    /**
     * We only have ONE product ID, but possibly multiple image rows.
     * We'll combine them into a single object with a .images array.
     */
    const product = rows.reduce((acc, row) => {
      // If acc is still null, initialize with the product data
      if (!acc) {
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          price: row.price,
          mark_up_amount: row.mark_up_amount,
          subcategory_id: row.subcategory_id,
          subcategory_name: row.subcategory_name,
          maincategory_id: row.maincategory_id,
          maincategory_name: row.maincategory_name,
          stock_quantity: row.stock_quantity,
          uploaded_by_userID: row.uploaded_by_userID,
          uploaded_by: row.uploaded_by,
          created_at: row.created_at,
          images: row.image_path
            ? [
                {
                  image_path: row.image_path,
                  alt_text: row.alt_text,
                  is_primary: !!row.is_primary,
                },
              ]
            : [],
        };
      }

      // If there's already a product, just add the image if it exists
      if (row.image_path) {
        acc.images.push({
          image_path: row.image_path,
          alt_text: row.alt_text,
          is_primary: !!row.is_primary,
        });
      }
      return acc;
    }, null);

    // Send the product as JSON
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  } finally {
    connection.release();
  }
};

// Endpoint to deactivate a product (set is_active to false)
export const deactivateProduct = async (req, res) => {
  const { id } = req.params; // Expect product id in the URL params

  if (!id) {
    return res.status(400).json({ message: "Product id is required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE products SET is_active = false WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Product not found." });
    }

    await connection.commit();
    res.status(200).json({ message: "Product deactivated successfully." });
  } catch (error) {
    console.error("Error deactivating product:", error);
    await connection.rollback();
    res.status(500).json({ message: "Failed to deactivate product." });
  } finally {
    connection.release();
  }
};

// Endpoint to activate a product (set is_active to true)
export const activateProduct = async (req, res) => {
  const { id } = req.params; // Expect product id in the URL params

  if (!id) {
    return res.status(400).json({ message: "Product id is required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE products SET is_active = true WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Product not found." });
    }

    await connection.commit();
    res.status(200).json({ message: "Product activated successfully." });
  } catch (error) {
    console.error("Error activating product:", error);
    await connection.rollback();
    res.status(500).json({ message: "Failed to activate product." });
  } finally {
    connection.release();
  }
};

// Endpoint to edit a product
export const editProduct = async (req, res) => {
  // Get product id from URL params
  const { id } = req.params;
  // Get updated product fields from request body
  const { name, description, price, category_id, stockQuantity } = req.body;

  // Basic validation: ensure required fields are provided
  if (
    !id ||
    !name ||
    !description ||
    !price ||
    !category_id ||
    !stockQuantity
  ) {
    return res.status(400).json({
      message: "All required fields must be provided.",
    });
  }

  // Calculate markup amount
  const markUpAmount = parseFloat(price) * 0.1;

  const connection = await db.getConnection();
  try {
    // 1) Fetch category info for the updated category_id
    const [categoryInfo] = await connection.query(
      `SELECT 
         c1.name AS category_name, 
         c1.id AS category_id,
         c1.parent_id,
         c2.name AS maincategory_name, 
         c2.id AS maincategory_id
       FROM categories c1
       LEFT JOIN categories c2 ON c1.parent_id = c2.id
       WHERE c1.id = ?`,
      [category_id]
    );

    if (categoryInfo.length === 0) {
      return res.status(400).json({ message: "Invalid category_id" });
    }

    const { category_name, parent_id, maincategory_id, maincategory_name } =
      categoryInfo[0];
    // Determine if the category is a main category
    const isMainCategory = parent_id === null;

    // 2) Start transaction
    await connection.beginTransaction();

    // 3) Update product in the `products` table
    await connection.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, mark_up_amount = ?, 
           subcategory_id = ?, subcategory_name = ?, 
           maincategory_id = ?, maincategory_name = ?, 
           stock_quantity = ?
       WHERE id = ?`,
      [
        name,
        description,
        price,
        markUpAmount,
        isMainCategory ? category_id : category_id,
        isMainCategory ? category_name : category_name,
        isMainCategory ? category_id : maincategory_id,
        isMainCategory ? category_name : maincategory_name,
        stockQuantity,
        id,
      ]
    );

    if (req.files && req.files.length > 0) {
      await connection.query(
        "DELETE FROM images WHERE imageable_id = ? AND imageable_type = 'products'",
        [id]
      );

      const imageQueries = req.files.map((file, index) => {
        const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
        return connection.query(
          `INSERT INTO images 
           (imageable_id, imageable_type, image_path, alt_text, is_primary)
           VALUES (?, 'products', ?, ?, ?)`,
          [id, modifiedFilePath, null, index === 0]
        );
      });

      await Promise.all(imageQueries);
    }

    await connection.commit();

    res.status(200).json({ message: "Product updated successfully." });
  } catch (error) {
    console.error("Error editing product:", error);
    await connection.rollback();
    res.status(500).json({ message: "Failed to update product." });
  } finally {
    connection.release();
  }
};
