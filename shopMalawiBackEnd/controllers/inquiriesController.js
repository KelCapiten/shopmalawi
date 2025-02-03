//\controllers\inquiriesController.js
import db from "../config/db.js";

// endpoint to add product inquiry
export const addInquiry = async (req, res) => {
  const { name, description, category_id, stock_quantity, location_id } =
    req.body;

  // Validate required fields
  if (
    !name ||
    !description ||
    !category_id ||
    stock_quantity === undefined ||
    !location_id
  ) {
    return res.status(400).json({
      message:
        "All required fields (name, description, category_id, stock_quantity, location_id) are necessary.",
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
         (name, description, category_id, stock_quantity, uploaded_by, location_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        name,
        description,
        category_id,
        stock_quantity,
        uploadedBy,
        location_id,
        "pending",
      ]
    );

    const inquiryId = inquiryResult.insertId;

    // 2) Insert images into the images table (polymorphic)
    const imageQueries = req.files.map((file, index) => {
      const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
      return connection.query(
        `INSERT INTO images 
           (imageable_id, imageable_type, image_path, is_primary)
           VALUES (?, 'product_inquiries', ?, ?);`,
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
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN users u ON i.uploaded_by = u.id
        LEFT JOIN locations l ON i.location_id = l.id
        LEFT JOIN images img ON img.imageable_id = i.id AND img.imageable_type = 'product_inquiries'
        ORDER BY i.created_at DESC
      `;

    const [results] = await connection.query(query);

    const inquiries = results.reduce((acc, row) => {
      const inquiry = acc.find((item) => item.id === row.id);
      const image = row.image_path
        ? { image_path: row.image_path, is_primary: !!row.is_primary }
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

// endpoint to update product inquiry (with image update)
export const updateInquiry = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    category_id,
    stock_quantity,
    location_id,
    status,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !description ||
    !category_id ||
    stock_quantity === undefined ||
    !location_id
  ) {
    return res.status(400).json({
      message:
        "All required fields (name, description, category_id, stock_quantity, location_id) are necessary.",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1) Update the inquiry in product_inquiries table
    const [result] = await connection.query(
      `UPDATE product_inquiries 
       SET name = ?, description = ?, category_id = ?, stock_quantity = ?, location_id = ?, status = ?
       WHERE id = ?`,
      [
        name,
        description,
        category_id,
        stock_quantity,
        location_id,
        status || "pending",
        id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // 2) If new images are provided, update images.
    if (req.files && req.files.length > 0) {
      // Delete existing images for this inquiry
      await connection.query(
        `DELETE FROM images WHERE imageable_id = ? AND imageable_type = 'product_inquiries'`,
        [id]
      );

      // Insert new images
      const imageQueries = req.files.map((file, index) => {
        const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
        return connection.query(
          `INSERT INTO images 
             (imageable_id, imageable_type, image_path, is_primary)
             VALUES (?, 'product_inquiries', ?, ?)`,
          [id, modifiedFilePath, index === 0]
        );
      });
      await Promise.all(imageQueries);
    }

    await connection.commit();
    res.status(200).json({ message: "Inquiry updated successfully" });
  } catch (error) {
    console.error("Error updating inquiry:", error);
    await connection.rollback();
    res.status(500).json({ message: "Failed to update inquiry" });
  } finally {
    connection.release();
  }
};

// endpoint to delete product inquiry
export const deleteInquiry = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Delete associated images
    await connection.query(
      `DELETE FROM images WHERE imageable_id = ? AND imageable_type = 'product_inquiries'`,
      [id]
    );

    // Delete associated product offers (if any)
    await connection.query(
      `DELETE FROM product_offers WHERE inquiries_id = ?`,
      [id]
    );

    // Delete the inquiry itself
    const [result] = await connection.query(
      `DELETE FROM product_inquiries WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Inquiry not found" });
    }

    await connection.commit();

    res.status(200).json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    await connection.rollback();
    res.status(500).json({ message: "Failed to delete inquiry" });
  } finally {
    connection.release();
  }
};

// endpoint to associate an inquiry with product(s)
export const associateInquiryToProduct = async (req, res) => {
  const { inquiries_id, product_id } = req.body;

  if (!inquiries_id || !product_id) {
    return res
      .status(400)
      .json({ message: "inquiries_id and product_id are required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO product_offers (product_id, inquiries_id) VALUES (?, ?)`,
      [product_id, inquiries_id]
    );
    await connection.commit();
    res
      .status(201)
      .json({ message: "Inquiry successfully associated with the product." });
  } catch (error) {
    console.error("Error associating inquiry with product:", error);
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This product is already associated with the inquiry.",
      });
    }
    res
      .status(500)
      .json({ message: "Failed to associate inquiry with the product." });
  } finally {
    connection.release();
  }
};

// endpoint to disassociate an inquiry from product(s)
export const disassociateInquiryFromProduct = async (req, res) => {
  // Changed from req.body to req.params
  const { inquiries_id, product_id } = req.params;

  if (!inquiries_id || !product_id) {
    return res
      .status(400)
      .json({ message: "inquiries_id and product_id are required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await connection.query(
      `DELETE FROM product_offers WHERE inquiries_id = ? AND product_id = ?`,
      [inquiries_id, product_id]
    );
    if (result[0].affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "No association found between the inquiry and the product.",
      });
    }
    await connection.commit();
    res.status(200).json({
      message: "Inquiry successfully disassociated from the product.",
    });
  } catch (error) {
    console.error("Error disassociating inquiry from product:", error);
    await connection.rollback();
    res
      .status(500)
      .json({ message: "Failed to disassociate inquiry from the product." });
  } finally {
    connection.release();
  }
};

// endpoint to get Products Associated with an Inquiry and User
export const getProductsByInquiryAndUser = async (req, res) => {
  const { inquiries_id, uploaded_by } = req.query;

  if (!inquiries_id || !uploaded_by) {
    return res.status(400).json({
      message: "inquiries_id and uploaded_by are required parameters.",
    });
  }

  const connection = await db.getConnection();
  try {
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
        po.created_at AS association_date
      FROM product_offers po
      JOIN products p ON po.product_id = p.id
      LEFT JOIN images i ON p.id = i.imageable_id AND i.imageable_type = 'products'
      LEFT JOIN users u ON p.uploaded_by = u.id
      WHERE po.inquiries_id = ? AND p.uploaded_by = ?
      ORDER BY po.created_at ASC
    `;

    const [products] = await connection.query(query, [
      parseInt(inquiries_id, 10),
      parseInt(uploaded_by, 10),
    ]);

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
          association_date: product.association_date,
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

    const groupedByOffers = {
      subcategory_name: "Offers",
      products: productsWithImages,
    };

    res.status(200).json([groupedByOffers]);
  } catch (error) {
    console.error("Error fetching products by inquiry and user:", error);
    res.status(500).json({ message: "Failed to fetch products." });
  } finally {
    connection.release();
  }
};
