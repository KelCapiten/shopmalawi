// controllers/orderAndPaymentController.js
import db from "../config/db.js";

export const createOrderAndPayment = async (req, res) => {
  const {
    user_id,
    shipping_address,
    shipping_town,
    order_items,
    total_amount,
    payment_method_id,
    payment_amount,
    transaction_id,
  } = req.body;

  let parsedOrderItems = order_items;
  if (typeof order_items === "string") {
    try {
      parsedOrderItems = JSON.parse(order_items);
    } catch {
      return res.status(400).json({ message: "Invalid order_items format." });
    }
  }

  if (
    !user_id ||
    !shipping_address ||
    !shipping_town ||
    !parsedOrderItems ||
    !Array.isArray(parsedOrderItems) ||
    parsedOrderItems.length === 0 ||
    !total_amount ||
    !payment_method_id ||
    !payment_amount
  ) {
    return res.status(400).json({
      message:
        "Missing required fields: user_id, shipping_address, shipping_town, order_items, total_amount, payment_method_id, and payment_amount are required.",
    });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Payment screenshot file is required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, shipping_address, shipping_town, total_amount) VALUES (?, ?, ?, ?)`,
      [user_id, shipping_address, shipping_town, total_amount]
    );
    const order_id = orderResult.insertId;

    for (const item of parsedOrderItems) {
      const { product_id, quantity, price } = item;
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [order_id, product_id, quantity, price]
      );
    }

    const file = req.file;
    const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
    const [screenshotResult] = await connection.query(
      `INSERT INTO payment_screenshots (name, image_path, alt_text) VALUES (?, ?, ?)`,
      [file.originalname, modifiedFilePath, "Payment Screenshot"]
    );
    const payment_screenshots_id = screenshotResult.insertId;

    const generatedTransactionId = transaction_id || `TX-${order_id}`;

    const [paymentResult] = await connection.query(
      `INSERT INTO payments (order_id, amount, payment_method_id, payment_screenshots_id, transaction_id) VALUES (?, ?, ?, ?, ?)`,
      [
        order_id,
        payment_amount,
        payment_method_id,
        payment_screenshots_id,
        generatedTransactionId,
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Order and payment created successfully",
      order_id,
      payment_id: paymentResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating order and payment:", error);
    res.status(500).json({ message: "Failed to create order and payment" });
  } finally {
    connection.release();
  }
};

export const getBuyOrders = async (req, res) => {
  const { user_id } = req.query;
  const connection = await db.getConnection();

  try {
    // Extended query to join products, images, payments, and include refund info if available
    let query = `
      SELECT
        o.id               AS order_id,
        o.user_id,
        o.shipping_address,
        o.shipping_town,
        o.total_amount,
        o.created_at,

        oi.product_id,
        oi.quantity,
        oi.price           AS purchase_price,

        pd.name            AS product_name,
        pd.description     AS product_description,
        pd.price           AS current_unit_price,
        pd.mark_up_amount,
        pd.subcategory_id,
        pd.subcategory_name,
        pd.maincategory_id,
        pd.maincategory_name,
        pd.stock_quantity,
        pd.uploaded_by,

        img.id             AS image_id,
        img.image_path,
        img.alt_text,
        img.is_primary,

        p.id               AS payment_id,
        p.amount           AS payment_amount,
        p.payment_method_id,
        p.transaction_id,
        p.status           AS payment_status,

        ps.id              AS screenshot_id,
        ps.name            AS screenshot_name,
        ps.image_path      AS screenshot_path,
        ps.alt_text        AS screenshot_alt,

        r.id               AS refund_id,
        r.reason           AS refund_reason,
        r.status           AS refund_status,
        r.created_at       AS refund_created_at,
        r.updated_at       AS refund_updated_at,

        ps2.id             AS refund_screenshot_id,
        ps2.name           AS refund_screenshot_name,
        ps2.image_path     AS refund_screenshot_path,
        ps2.alt_text       AS refund_screenshot_alt

      FROM orders o
      LEFT JOIN order_items oi           ON o.id = oi.order_id
      LEFT JOIN products pd              ON oi.product_id = pd.id
      LEFT JOIN images img               ON pd.id = img.imageable_id
                                        AND img.imageable_type = 'products'
      LEFT JOIN payments p               ON o.id = p.order_id
      LEFT JOIN payment_screenshots ps   ON p.payment_screenshots_id = ps.id
      LEFT JOIN refunds r                ON o.id = r.order_id
      LEFT JOIN payment_screenshots ps2  ON r.payment_screenshots_id = ps2.id
    `;

    const params = [];
    if (user_id) {
      query += " WHERE o.user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY o.created_at DESC, oi.product_id, img.id";

    const [rows] = await connection.query(query, params);

    const orders = [];

    for (const row of rows) {
      // Check if this order already exists
      let order = orders.find((o) => o.order_id === row.order_id);
      if (!order) {
        order = {
          order_id: row.order_id,
          user_id: row.user_id,
          shipping_address: row.shipping_address,
          shipping_town: row.shipping_town,
          total_amount: row.total_amount,
          created_at: row.created_at,
          order_items: [],
          payment: null,
          refund: null,
        };
        orders.push(order);
      }

      // Set payment if available
      if (!order.payment && row.payment_id) {
        order.payment = {
          payment_id: row.payment_id,
          amount: row.payment_amount,
          payment_method_id: row.payment_method_id,
          transaction_id: row.transaction_id,
          status: row.payment_status,
          payment_screenshot: row.screenshot_id
            ? {
                id: row.screenshot_id,
                name: row.screenshot_name,
                image_path: row.screenshot_path,
                alt_text: row.screenshot_alt,
              }
            : null,
        };
      }

      // Set refund info if available
      if (!order.refund && row.refund_id) {
        order.refund = {
          refund_id: row.refund_id,
          reason: row.refund_reason,
          status: row.refund_status,
          created_at: row.refund_created_at,
          updated_at: row.refund_updated_at,
          refund_screenshot: row.refund_screenshot_id
            ? {
                id: row.refund_screenshot_id,
                name: row.refund_screenshot_name,
                image_path: row.refund_screenshot_path,
                alt_text: row.refund_screenshot_alt,
              }
            : null,
        };
      }

      // Build or update order items
      if (row.product_id) {
        let orderItem = order.order_items.find(
          (it) => it.product_id === row.product_id
        );
        if (!orderItem) {
          orderItem = {
            product_id: row.product_id,
            quantity: row.quantity,
            purchase_price: row.purchase_price,
            name: row.product_name,
            description: row.product_description,
            current_unit_price: row.current_unit_price,
            mark_up_amount: row.mark_up_amount,
            subcategory_id: row.subcategory_id,
            subcategory_name: row.subcategory_name,
            maincategory_id: row.maincategory_id,
            maincategory_name: row.maincategory_name,
            stock_quantity: row.stock_quantity,
            uploaded_by: row.uploaded_by,
            images: [],
          };
          order.order_items.push(orderItem);
        }
        if (row.image_id) {
          const exists = orderItem.images.find(
            (img) => img.image_id === row.image_id
          );
          if (!exists) {
            orderItem.images.push({
              image_id: row.image_id,
              image_path: row.image_path,
              alt_text: row.alt_text,
              is_primary: !!row.is_primary,
            });
          }
        }
      }
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).json({ message: "Failed to retrieve orders" });
  } finally {
    connection.release();
  }
};

export const getSellOrders = async (req, res) => {
  const { user_id } = req.query;
  const connection = await db.getConnection();

  try {
    // Query to retrieve sell orders with refund info if available
    let query = `
      SELECT
        o.id               AS order_id,
        o.user_id,
        o.shipping_address,
        o.shipping_town,
        o.total_amount,
        o.created_at,

        oi.product_id,
        oi.quantity,
        oi.price           AS purchase_price,

        pd.name            AS product_name,
        pd.description     AS product_description,
        pd.price           AS current_unit_price,
        pd.mark_up_amount,
        pd.subcategory_id,
        pd.subcategory_name,
        pd.maincategory_id,
        pd.maincategory_name,
        pd.stock_quantity,
        pd.uploaded_by,

        img.id             AS image_id,
        img.image_path,
        img.alt_text,
        img.is_primary,

        p.id               AS payment_id,
        p.amount           AS payment_amount,
        p.payment_method_id,
        p.transaction_id,
        p.status           AS payment_status,

        ps.id              AS screenshot_id,
        ps.name            AS screenshot_name,
        ps.image_path      AS screenshot_path,
        ps.alt_text        AS screenshot_alt,

        r.id               AS refund_id,
        r.reason           AS refund_reason,
        r.status           AS refund_status,
        r.created_at       AS refund_created_at,
        r.updated_at       AS refund_updated_at,

        ps2.id             AS refund_screenshot_id,
        ps2.name           AS refund_screenshot_name,
        ps2.image_path     AS refund_screenshot_path,
        ps2.alt_text       AS refund_screenshot_alt

      FROM orders o
      LEFT JOIN order_items oi           ON o.id = oi.order_id
      LEFT JOIN products pd              ON oi.product_id = pd.id
      LEFT JOIN images img               ON pd.id = img.imageable_id
                                        AND img.imageable_type = 'products'
      LEFT JOIN payments p               ON o.id = p.order_id
      LEFT JOIN payment_screenshots ps   ON p.payment_screenshots_id = ps.id
      LEFT JOIN refunds r                ON o.id = r.order_id
      LEFT JOIN payment_screenshots ps2  ON r.payment_screenshots_id = ps2.id
      WHERE pd.uploaded_by = ?
      ORDER BY o.created_at DESC, oi.product_id, img.id
    `;

    const params = [user_id];

    const [rows] = await connection.query(query, params);

    const orders = [];

    for (const row of rows) {
      // Check if order exists in orders array
      let order = orders.find((o) => o.order_id === row.order_id);
      if (!order) {
        order = {
          order_id: row.order_id,
          user_id: row.user_id,
          shipping_address: row.shipping_address,
          shipping_town: row.shipping_town,
          total_amount: row.total_amount,
          created_at: row.created_at,
          order_items: [],
          payment: null,
          refund: null,
        };
        orders.push(order);
      }

      // Set payment details if available
      if (!order.payment && row.payment_id) {
        order.payment = {
          payment_id: row.payment_id,
          amount: row.payment_amount,
          payment_method_id: row.payment_method_id,
          transaction_id: row.transaction_id,
          status: row.payment_status,
          payment_screenshot: row.screenshot_id
            ? {
                id: row.screenshot_id,
                name: row.screenshot_name,
                image_path: row.screenshot_path,
                alt_text: row.screenshot_alt,
              }
            : null,
        };
      }

      // Set refund info if available
      if (!order.refund && row.refund_id) {
        order.refund = {
          refund_id: row.refund_id,
          reason: row.refund_reason,
          status: row.refund_status,
          created_at: row.refund_created_at,
          updated_at: row.refund_updated_at,
          refund_screenshot: row.refund_screenshot_id
            ? {
                id: row.refund_screenshot_id,
                name: row.refund_screenshot_name,
                image_path: row.refund_screenshot_path,
                alt_text: row.refund_screenshot_alt,
              }
            : null,
        };
      }

      // Process order items if the product uploader matches the seller (user_id)
      if (row.product_id && row.uploaded_by == user_id) {
        let orderItem = order.order_items.find(
          (it) => it.product_id === row.product_id
        );
        if (!orderItem) {
          orderItem = {
            product_id: row.product_id,
            quantity: row.quantity,
            purchase_price: row.purchase_price,
            name: row.product_name,
            description: row.product_description,
            current_unit_price: row.current_unit_price,
            mark_up_amount: row.mark_up_amount,
            subcategory_id: row.subcategory_id,
            subcategory_name: row.subcategory_name,
            maincategory_id: row.maincategory_id,
            maincategory_name: row.maincategory_name,
            stock_quantity: row.stock_quantity,
            uploaded_by: row.uploaded_by,
            images: [],
          };
          order.order_items.push(orderItem);
        }
        if (row.image_id) {
          const exists = orderItem.images.find(
            (img) => img.image_id === row.image_id
          );
          if (!exists) {
            orderItem.images.push({
              image_id: row.image_id,
              image_path: row.image_path,
              alt_text: row.alt_text,
              is_primary: !!row.is_primary,
            });
          }
        }
      }
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error retrieving sell orders:", error);
    res.status(500).json({ message: "Failed to retrieve sell orders" });
  } finally {
    connection.release();
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status } = req.body;

  if (
    ![
      "pending",
      "completed",
      "failed",
      "refund",
      "refunding",
      "refunded",
      "canceled",
    ].includes(status)
  ) {
    return res.status(400).json({
      message:
        "Invalid status value. Allowed values are 'pending', 'completed', or 'failed'.",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE payments SET status = ? WHERE id = ?",
      [status, paymentId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found." });
    }

    await connection.commit();
    res.status(200).json({ message: "Payment status updated successfully." });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update payment status." });
  } finally {
    connection.release();
  }
};

export const updateExpiredPaymentStatuses = async () => {
  const connection = await db.getConnection();
  try {
    const [pendingResult] = await connection.query(
      "UPDATE payments SET status = 'failed' WHERE status = 'pending' AND created_at < NOW() - INTERVAL 24 HOUR"
    );
    console.log(
      `Updated ${pendingResult.affectedRows} expired pending payments to 'failed'.`
    );

    const [refundingResult] = await connection.query(
      "UPDATE payments SET status = 'refunded' WHERE status = 'refunding' AND created_at < NOW() - INTERVAL 24 HOUR"
    );
    console.log(
      `Updated ${refundingResult.affectedRows} expired refunding payments to 'refunded'.`
    );
  } catch (error) {
    console.error("Error updating expired payment statuses:", error);
  } finally {
    connection.release();
  }
};

export const recordRefund = async (req, res) => {
  const { order_id, reason } = req.body;

  if (!order_id) {
    return res
      .status(400)
      .json({ message: "Missing required field: order_id." });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ message: "Payment screenshot file is required." });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const file = req.file;
    const modifiedFilePath = `/${file.path.replace(/\\/g, "/")}`;
    const [screenshotResult] = await connection.query(
      `INSERT INTO payment_screenshots (name, image_path, alt_text) VALUES (?, ?, ?)`,
      [file.originalname, modifiedFilePath, "Refund Payment Screenshot"]
    );
    const payment_screenshots_id = screenshotResult.insertId;

    // 1) Select the existing record by `order_id`
    //    and use `id` instead of `refund_id`
    const [existingRefund] = await connection.query(
      `SELECT id FROM refunds WHERE order_id = ?`,
      [order_id]
    );

    let refund_id;
    if (existingRefund.length > 0) {
      // 2) Update existing record
      await connection.query(
        `UPDATE refunds 
         SET reason = ?, payment_screenshots_id = ? 
         WHERE order_id = ?`,
        [reason, payment_screenshots_id, order_id]
      );
      // 3) Grab the existing row's `id`
      refund_id = existingRefund[0].id;
    } else {
      // 4) Insert a new refund record if none exists
      const [refundResult] = await connection.query(
        `INSERT INTO refunds (order_id, reason, payment_screenshots_id) 
         VALUES (?, ?, ?)`,
        [order_id, reason, payment_screenshots_id]
      );
      refund_id = refundResult.insertId;
    }

    await connection.commit();

    res.status(201).json({
      message: "Refund request processed successfully.",
      refund_id,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error processing refund request:", error);
    res.status(500).json({ message: "Failed to process refund request." });
  } finally {
    connection.release();
  }
};
