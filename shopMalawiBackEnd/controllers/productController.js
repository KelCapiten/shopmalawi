//controllers/productController.js
import db from "../config/db.js";
import sanitizeHtml from "sanitize-html";

// Configure sanitization options - matched to form capabilities
const sanitizeOptions = {
  allowedTags: ["b", "strong", "ul", "ol", "li"],
  allowedAttributes: {},
  allowedStyles: {},
};

// endpoint to add products
export const addProduct = async (req, res) => {
  const { name, description, price, category_id, stockQuantity } = req.body;

  // Sanitize HTML content
  const sanitizedDescription = sanitizeHtml(description, sanitizeOptions);

  // Basic validation
  if (
    !name ||
    !sanitizedDescription ||
    !price ||
    !req.files ||
    req.files.length === 0
  ) {
    return res.status(400).json({
      message: "All required fields and at least one image are necessary.",
    });
  }

  const uploadedBy = req.user.id;
  const markUpAmount = parseFloat(price) * 0.1;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert product into `products` table
    const [productResult] = await connection.query(
      `INSERT INTO products 
       (name, description, price, mark_up_amount, category_id, 
        stock_quantity, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        sanitizedDescription,
        price,
        markUpAmount,
        category_id,
        stockQuantity,
        uploadedBy,
      ]
    );

    const productId = productResult.insertId;

    // Insert images into `images` table
    const imageQueries = req.files.map((file, index) => {
      const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
      return connection.query(
        `INSERT INTO images 
         (imageable_id, imageable_type, image_path, alt_text, is_primary) 
         VALUES (?, 'product', ?, ?, ?)`,
        [productId, modifiedFilePath, null, index === 0]
      );
    });

    await Promise.all(imageQueries);

    // Fetch the complete product details after creation
    const [productDetails] = await connection.query(
      `SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price,
        p.mark_up_amount,
        p.category_id,
        c.name as category_name,
        mc.name as maincategory_name,
        mc.id as maincategory_id,
        p.stock_quantity, 
        p.is_active,
        p.uploaded_by AS uploaded_by_userID, 
        u.username AS uploaded_by,
        p.created_at
      FROM products p
      LEFT JOIN users u ON p.uploaded_by = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories mc ON c.parent_id = mc.id
      WHERE p.id = ?`,
      [productId]
    );

    // Fetch the product images
    const [productImages] = await connection.query(
      `SELECT image_path, alt_text, is_primary 
       FROM images 
       WHERE imageable_id = ? AND imageable_type = 'product'`,
      [productId]
    );

    await connection.commit();

    // Combine product details with images
    const completeProduct = {
      ...productDetails[0],
      images: productImages,
    };

    res.status(201).json({
      message: "Product added successfully",
      productId,
      product: completeProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
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

    let query = `
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price,
        p.category_id,
        c.name as category_name,
        mc.name as maincategory_name,
        mc.id as maincategory_id,
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
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN categories mc ON c.parent_id = mc.id
      LEFT JOIN images i
        ON i.imageable_id = p.id
        AND i.imageable_type = 'product'
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
        // If it's a main category, include all products in that category or its subcategories
        whereConditions.push(`
          (c.id = ? OR c.parent_id = ?)
        `);
        queryParams.push(parseInt(category_id, 10), parseInt(category_id, 10));
      } else {
        // If it's a subcategory, include only products in that category
        whereConditions.push(`c.id = ?`);
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
          category_id: product.category_id,
          category_name: product.category_name,
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
  const { id } = req.params;
  const { name, description, price, category_id, stockQuantity } = req.body;

  // Sanitize HTML content
  const sanitizedDescription = sanitizeHtml(description, sanitizeOptions);

  // Basic validation
  if (
    !id ||
    !name ||
    !sanitizedDescription ||
    !price ||
    !category_id ||
    !stockQuantity
  ) {
    return res.status(400).json({
      message: "All required fields must be provided.",
    });
  }

  const markUpAmount = parseFloat(price) * 0.1;

  const connection = await db.getConnection();
  try {
    // Fetch category info
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

    await connection.beginTransaction();

    // Update product with correct column names
    await connection.query(
      `UPDATE products 
       SET name = ?, 
           description = ?, 
           price = ?, 
           mark_up_amount = ?, 
           category_id = ?,
           stock_quantity = ?
       WHERE id = ?`,
      [
        name,
        sanitizedDescription,
        price,
        markUpAmount,
        category_id,
        stockQuantity,
        id,
      ]
    );

    if (req.files && req.files.length > 0) {
      await connection.query(
        "DELETE FROM images WHERE imageable_id = ? AND imageable_type = 'product'",
        [id]
      );

      const imageQueries = req.files.map((file, index) => {
        const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
        return connection.query(
          `INSERT INTO images 
           (imageable_id, imageable_type, image_path, alt_text, is_primary)
           VALUES (?, 'product', ?, ?, ?)`,
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
