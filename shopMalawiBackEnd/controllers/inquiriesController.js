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

    // 2) Insert images into the new 'images' table (polymorphic)
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
