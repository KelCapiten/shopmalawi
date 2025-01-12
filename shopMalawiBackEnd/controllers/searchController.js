import db from "../config/db.js";

// Endpoint to search for products
export const searchProducts = async (req, res) => {
  const { query, categoryId, priceRange, sortBy } = req.query;

  try {
    let sql = `
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
        categories c ON p.category_id = c.id
      LEFT JOIN 
        product_images pi ON p.id = pi.product_id
      LEFT JOIN 
        users u ON p.uploaded_by = u.id
      WHERE 
        1 = 1
    `;

    const params = [];

    // Add search query filter
    if (query) {
      sql += " AND MATCH(p.name, p.description) AGAINST(?) ";
      params.push(query);
    }

    // Add category filter
    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId, 10);
      if (isNaN(parsedCategoryId)) {
        return res
          .status(400)
          .json({ message: "Invalid categoryId parameter" });
      }

      const [categoryRows] = await db.query(
        `SELECT id FROM categories WHERE id = ? AND EXISTS (SELECT 1 FROM categories WHERE parent_id = ?)`,
        [parsedCategoryId, parsedCategoryId]
      );

      if (categoryRows.length > 0) {
        const [subRows] = await db.query(
          `SELECT id FROM categories WHERE parent_id = ?`,
          [parsedCategoryId]
        );

        const subcategoryIds = subRows.map((row) => row.id);

        if (subcategoryIds.length > 0) {
          const placeholders = subcategoryIds.map(() => "?").join(",");
          sql += ` AND (p.category_id = ? OR p.category_id IN (${placeholders})) `;
          params.push(parsedCategoryId, ...subcategoryIds);
        } else {
          sql += " AND p.category_id = ? ";
          params.push(parsedCategoryId);
        }
      } else {
        sql += " AND p.category_id = ? ";
        params.push(parsedCategoryId);
      }
    }

    // Add price range filter
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split(",");
      if (minPrice) {
        sql += " AND p.price >= ? ";
        params.push(minPrice);
      }
      if (maxPrice) {
        sql += " AND p.price <= ? ";
        params.push(maxPrice);
      }
    }

    // Add sorting
    if (sortBy) {
      const sortOptions = {
        priceAsc: "p.price ASC",
        priceDesc: "p.price DESC",
        nameAsc: "p.name ASC",
        nameDesc: "p.name DESC",
      };
      sql += ` ORDER BY ${sortOptions[sortBy] || "p.created_at DESC"} `;
    }

    // Execute the query
    const [products] = await db.query(sql, params);

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
          category: product.category_name,
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

    res.status(200).json(productsWithImages);
  } catch (error) {
    console.error("Error searching for products:", error);
    res.status(500).json({ message: "Failed to perform search" });
  }
};
