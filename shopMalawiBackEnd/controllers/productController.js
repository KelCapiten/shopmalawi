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
  const { name, description, price, subcategory_id, stockQuantity } = req.body;

  if (!name || !description || !price || !req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "All required fields and at least one image are necessary.",
    });
  }

  const uploadedBy = req.user.id;
  const markUpAmount = parseFloat(price) * 0.1;

  const connection = await db.getConnection();
  try {
    // Fetch maincategory_id, subcategory_name, and maincategory_name
    const [categoryInfo] = await connection.query(
      `SELECT 
         c1.name AS subcategory_name, 
         c1.id AS subcategory_id,
         c2.name AS maincategory_name, 
         c2.id AS maincategory_id
       FROM categories c1
       LEFT JOIN categories c2 ON c1.parent_id = c2.id
       WHERE c1.id = ?`,
      [subcategory_id]
    );

    if (categoryInfo.length === 0) {
      return res.status(400).json({ message: "Invalid subcategory_id" });
    }

    const { maincategory_id, maincategory_name, subcategory_name } =
      categoryInfo[0];

    // Start transaction
    await connection.beginTransaction();

    // Insert product
    const [productResult] = await connection.query(
      `INSERT INTO products 
       (name, description, price, mark_up_amount, subcategory_id, subcategory_name, maincategory_id, maincategory_name, stock_quantity, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price,
        markUpAmount,
        subcategory_id,
        subcategory_name,
        maincategory_id,
        maincategory_name,
        stockQuantity,
        uploadedBy,
      ]
    );

    const productId = productResult.insertId;

    // Insert image paths into product_images table
    const imageQueries = req.files.map((file, index) => {
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

// endpoint to get all products with optional filters
export const getAllProducts = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { subcategory_id, startDate, endDate, groupBy } = req.query;

    // Base SQL query
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
        pi.image_path, 
        pi.alt_text, 
        pi.is_primary,
        p.created_at
      FROM 
        products p
      LEFT JOIN 
        product_images pi 
      ON 
        p.id = pi.product_id
      LEFT JOIN 
        users u 
      ON 
        p.uploaded_by = u.id
    `;

    const queryParams = [];
    const whereConditions = [];

    // Filter by subcategory_id if provided
    if (subcategory_id) {
      whereConditions.push(`p.subcategory_id = ?`);
      queryParams.push(parseInt(subcategory_id, 10));
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

    query += ` ORDER BY p.created_at DESC`;

    // Execute query
    const [products] = await connection.query(query, queryParams);

    // Process products
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
          subcategory_id: product.subcategory_id,
          subcategory_name: product.subcategory_name,
          maincategory_id: product.maincategory_id,
          maincategory_name: product.maincategory_name,
          stock_quantity: product.stock_quantity,
          uploaded_by_userID: product.uploaded_by_userID,
          uploaded_by: product.uploaded_by,
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

    let groupedProducts = [];

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
      groupedProducts = Object.values(categories);
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
      groupedProducts = Object.values(categories);
    } else {
      // No grouping
      groupedProducts = productsWithImages;
    }

    res.status(200).json(groupedProducts);
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

    // Query to fetch the product by ID along with related data
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
        pi.image_path, 
        pi.alt_text, 
        pi.is_primary,
        p.created_at
      FROM 
        products p
      LEFT JOIN 
        product_images pi 
      ON 
        p.id = pi.product_id
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
          subcategory_id: item.subcategory_id,
          subcategory_name: item.subcategory_name,
          maincategory_id: item.maincategory_id,
          maincategory_name: item.maincategory_name,
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
    connection.release();
  }
};
