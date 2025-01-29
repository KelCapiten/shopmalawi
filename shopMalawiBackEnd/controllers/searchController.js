import db from "../config/db.js";

// Endpoint to search for products
export const searchProducts = async (req, res) => {
  const {
    query,
    subcategory_id,
    maincategory_id,
    priceRange,
    sortBy,
    uploaded_by,
  } = req.query;

  try {
    let sql = `
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
      FROM products p
      LEFT JOIN images pi ON p.id = pi.imageable_id AND pi.imageable_type = 'products'
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += " AND MATCH(p.name, p.description) AGAINST(?) ";
      params.push(query);
    }

    if (subcategory_id) {
      const parsedSubcategoryId = parseInt(subcategory_id, 10);
      if (isNaN(parsedSubcategoryId)) {
        return res
          .status(400)
          .json({ message: "Invalid subcategory_id parameter" });
      }
      sql += " AND p.subcategory_id = ? ";
      params.push(parsedSubcategoryId);
    }

    if (maincategory_id) {
      const parsedMaincategoryId = parseInt(maincategory_id, 10);
      if (isNaN(parsedMaincategoryId)) {
        return res
          .status(400)
          .json({ message: "Invalid maincategory_id parameter" });
      }
      const [subRows] = await db.query(
        `SELECT id FROM categories WHERE parent_id = ?`,
        [parsedMaincategoryId]
      );
      const subcategoryIds = subRows.map((row) => row.id);
      if (subcategoryIds.length > 0) {
        const placeholders = subcategoryIds.map(() => "?").join(",");
        sql += ` AND (p.maincategory_id = ? OR p.subcategory_id IN (${placeholders})) `;
        params.push(parsedMaincategoryId, ...subcategoryIds);
      } else {
        sql += " AND p.maincategory_id = ? ";
        params.push(parsedMaincategoryId);
      }
    }

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

    if (uploaded_by) {
      const parsedUploadedBy = parseInt(uploaded_by, 10);
      if (isNaN(parsedUploadedBy)) {
        return res
          .status(400)
          .json({ message: "Invalid uploaded_by parameter" });
      }
      sql += " AND p.uploaded_by = ? ";
      params.push(parsedUploadedBy);
    }

    if (sortBy) {
      const sortOptions = {
        priceAsc: "p.price ASC",
        priceDesc: "p.price DESC",
        nameAsc: "p.name ASC",
        nameDesc: "p.name DESC",
      };
      sql += ` ORDER BY ${sortOptions[sortBy] || "p.created_at DESC"} `;
    }

    const [rawProducts] = await db.query(sql, params);

    const products = rawProducts.reduce((acc, product) => {
      const existing = acc.find((p) => p.id === product.id);
      if (existing) {
        existing.images.push({
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

    const response = [
      {
        id: 0,
        name: "Search Results",
        products,
      },
    ];

    res.status(200).json(response);
  } catch (error) {
    console.error("Error searching for products:", error);
    res.status(500).json({ message: "Failed to perform search" });
  }
};

// Endpoint to search for products for inquiries
export const searchProductsExcludingOffered = async (req, res) => {
  const {
    query,
    subcategory_id,
    maincategory_id,
    priceRange,
    sortBy,
    uploaded_by,
    inquiries_id,
  } = req.query;

  if (!inquiries_id) {
    return res.status(400).json({
      message: "inquiries_id is required to exclude already offered products.",
    });
  }

  try {
    let sql = `
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
        images pi ON p.id = pi.imageable_id AND pi.imageable_type = 'products'
      LEFT JOIN 
        users u ON p.uploaded_by = u.id
      WHERE 
        p.id NOT IN (
          SELECT product_id
          FROM product_offers
          WHERE inquiries_id = ?
        )
    `;
    const params = [inquiries_id];

    if (query) {
      sql += " AND MATCH(p.name, p.description) AGAINST(?) ";
      params.push(query);
    }

    if (subcategory_id) {
      const parsedSubcategoryId = parseInt(subcategory_id, 10);
      if (isNaN(parsedSubcategoryId)) {
        return res
          .status(400)
          .json({ message: "Invalid subcategory_id parameter" });
      }
      sql += " AND p.subcategory_id = ? ";
      params.push(parsedSubcategoryId);
    }

    if (maincategory_id) {
      const parsedMaincategoryId = parseInt(maincategory_id, 10);
      if (isNaN(parsedMaincategoryId)) {
        return res
          .status(400)
          .json({ message: "Invalid maincategory_id parameter" });
      }

      const [subRows] = await db.query(
        `SELECT id FROM categories WHERE parent_id = ?`,
        [parsedMaincategoryId]
      );
      const subcategoryIds = subRows.map((row) => row.id);

      if (subcategoryIds.length > 0) {
        const placeholders = subcategoryIds.map(() => "?").join(",");
        sql += ` AND (p.maincategory_id = ? OR p.subcategory_id IN (${placeholders})) `;
        params.push(parsedMaincategoryId, ...subcategoryIds);
      } else {
        sql += " AND p.maincategory_id = ? ";
        params.push(parsedMaincategoryId);
      }
    }

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

    if (uploaded_by) {
      const parsedUploadedBy = parseInt(uploaded_by, 10);
      if (isNaN(parsedUploadedBy)) {
        return res
          .status(400)
          .json({ message: "Invalid uploaded_by parameter" });
      }
      sql += " AND p.uploaded_by = ? ";
      params.push(parsedUploadedBy);
    }

    if (sortBy) {
      const sortOptions = {
        priceAsc: "p.price ASC",
        priceDesc: "p.price DESC",
        nameAsc: "p.name ASC",
        nameDesc: "p.name DESC",
      };
      sql += ` ORDER BY ${sortOptions[sortBy] || "p.created_at DESC"} `;
    }

    const [products] = await db.query(sql, params);

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

    const groupedBySubcategory = productsWithImages.reduce((acc, product) => {
      const subcategoryId = product.subcategory_id;
      if (!acc[subcategoryId]) {
        acc[subcategoryId] = {
          id: subcategoryId,
          name: product.subcategory_name,
          products: [],
        };
      }
      acc[subcategoryId].products.push(product);
      return acc;
    }, {});

    const response = Object.values(groupedBySubcategory);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error searching for products:", error);
    res.status(500).json({ message: "Failed to perform search" });
  }
};
