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
        p.stock_quantity, 
        c.name AS category_name, 
        pi.image_path, 
        pi.alt_text, 
        pi.is_primary
      FROM 
        products p
      LEFT JOIN 
        categories c ON p.category_id = c.id
      LEFT JOIN 
        product_images pi ON p.id = pi.product_id
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
      sql += " AND p.category_id = ? ";
      params.push(categoryId);
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
          stock_quantity: product.stock_quantity,
          category: product.category_name,
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
