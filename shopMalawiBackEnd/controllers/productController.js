import db from "../config/db.js";

// endpoint to add a category
export const addCategory = async (req, res) => {
  const { name, description, parent_id } = req.body;

  try {
    // Validate request body
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if parent_id exists (if provided)
    if (parent_id) {
      const [parentCheck] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [parent_id]
      );
      if (parentCheck.length === 0) {
        return res
          .status(400)
          .json({ message: "Parent category does not exist" });
      }
    }

    // Insert the new category
    const [result] = await db.query(
      "INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)",
      [name, description || null, parent_id || null]
    );

    res.status(201).json({
      message: "Category added successfully",
      category: {
        id: result.insertId,
        name,
        description,
        parent_id,
      },
    });
  } catch (error) {
    console.error("Error adding category:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Category name already exists" });
    }

    res.status(500).json({ message: "Failed to add category" });
  }
};

// endpoint to update a category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, parent_id } = req.body;

  try {
    if (!id || !name) {
      return res
        .status(400)
        .json({ message: "Category ID and name are required" });
    }

    if (parent_id) {
      const [parentCheck] = await db.query(
        "SELECT id FROM categories WHERE id = ?",
        [parent_id]
      );
      if (parentCheck.length === 0) {
        return res
          .status(400)
          .json({ message: "Parent category does not exist" });
      }
    }

    const [result] = await db.query(
      "UPDATE categories SET name = ?, description = ?, parent_id = ? WHERE id = ?",
      [name, description || null, parent_id || null, id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Category not found or no changes made" });
    }

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Category name already exists" });
    }

    res.status(500).json({ message: "Failed to update category" });
  }
};

// endpoint to delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const categoryId = parseInt(id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid Category ID" });
    }

    console.log("Received ID:", categoryId);

    const [result] = await db.query("DELETE FROM categories WHERE id = ?", [
      categoryId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};

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

    // Sort categories and subcategories A-Z by name
    const sortCategories = (categories) => {
      categories.sort((a, b) => a.name.localeCompare(b.name));
      categories.forEach((category) => {
        if (category.subcategories.length > 0) {
          sortCategories(category.subcategories);
        }
      });
    };

    // Sort the root categories
    sortCategories(rootCategories);

    res.status(200).json(rootCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

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
    const { category_id, startDate, endDate, groupBy } = req.query;

    // Base SQL query: note we join on `images i` instead of `product_images pi`
    // Also filter by i.imageable_type = 'products'
    let query = `
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
    `;

    const queryParams = [];
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
        acc.push({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          mark_up_amount: product.mark_up_amount,
          subcategory_id: product.subcategory_id,
          subcategory_name: product.subcategory_name,
          maincategory_id: product.maincategory_id,
          maincategory_name: product.maincategory_name,
          stock_quantity: product.stock_quantity,
          uploaded_by_userID: product.uploaded_by_userID,
          uploaded_by: product.uploaded_by,
          // If this row has an image, start images array with one item
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

// endpoint to add product inquiry
export const addInquiry = async (req, res) => {
  const { name, description, category_id, stock_quantity } = req.body;

  // Validate required fields
  if (!name || !description || !category_id || stock_quantity === undefined) {
    return res.status(400).json({
      message:
        "All required fields (name, description, category_id, stock_quantity) are necessary.",
    });
  }

  // Validate that at least one image is uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "At least one image is required.",
    });
  }

  const uploadedBy = req.user.id;
  const connection = await db.getConnection();

  try {
    // Start transaction
    await connection.beginTransaction();

    // 1) Insert inquiry into product_inquiries table
    const [inquiryResult] = await connection.query(
      `INSERT INTO product_inquiries 
       (name, description, category_id, stock_quantity, uploaded_by, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, category_id, stock_quantity, uploadedBy, "pending"]
    );

    const inquiryId = inquiryResult.insertId;

    // 2) Insert images into the new 'images' table (polymorphic)
    const imageQueries = req.files.map((file, index) => {
      const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;

      return connection.query(
        `INSERT INTO images 
         (imageable_id, imageable_type, image_path, is_primary)
         VALUES (?, 'product_inquiries', ?, ?)`,
        [inquiryId, modifiedFilePath, index === 0]
      );
    });

    await Promise.all(imageQueries);

    // Commit transaction
    await connection.commit();

    res.status(201).json({ message: "Inquiry added successfully", inquiryId });
  } catch (error) {
    console.error("Error adding inquiry:", error);
    // Rollback transaction on error
    await connection.rollback();
    res.status(500).json({ message: "Failed to add inquiry" });
  } finally {
    connection.release();
  }
};

// endpoint to get product inquiry
export const getInquiries = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Updated query to include location details
    const query = `
      SELECT 
        i.id, 
        i.name, 
        i.description, 
        i.category_id, 
        c.name AS category_name,
        i.stock_quantity, 
        i.uploaded_by AS uploaded_by_user_id, 
        u.username AS uploaded_by, 
        i.location_id,
        l.name AS location_name,
        i.status, 
        i.created_at, 
        i.updated_at,
        img.image_path,
        img.is_primary
      FROM product_inquiries i
      LEFT JOIN categories c 
        ON i.category_id = c.id
      LEFT JOIN users u 
        ON i.uploaded_by = u.id
      LEFT JOIN locations l
        ON i.location_id = l.id
      LEFT JOIN images img
        ON img.imageable_id = i.id
        AND img.imageable_type = 'product_inquiries'
      ORDER BY i.created_at DESC
    `;

    const [results] = await connection.query(query);

    // Group images by inquiry
    const inquiries = results.reduce((acc, row) => {
      const inquiry = acc.find((item) => item.id === row.id);

      // Build an image object if there's an image_path
      const image = row.image_path
        ? {
            image_path: row.image_path,
            is_primary: !!row.is_primary,
          }
        : null;

      if (!inquiry) {
        acc.push({
          id: row.id,
          name: row.name,
          description: row.description,
          category_id: row.category_id,
          category_name: row.category_name,
          stock_quantity: row.stock_quantity,
          uploaded_by_user_id: row.uploaded_by_user_id,
          uploaded_by: row.uploaded_by,
          location_id: row.location_id,
          location_name: row.location_name,
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          images: image ? [image] : [],
        });
      } else if (image) {
        inquiry.images.push(image);
      }

      return acc;
    }, []);

    res.status(200).json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({ message: "Failed to fetch inquiries" });
  } finally {
    connection.release();
  }
};
