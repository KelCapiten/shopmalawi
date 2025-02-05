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
