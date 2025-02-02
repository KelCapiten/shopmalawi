//\controllers\paymentsCrontroller.js
import db from "../config/db.js";

export const getPaymentMethods = async (req, res) => {
  const { user_id } = req.query;

  try {
    let paymentMethods;

    if (user_id) {
      // Fetch payment methods added by the specific user
      const [userPaymentMethods] = await db.query(
        `SELECT pm.id, pm.method_name AS name, pm.description 
         FROM payment_methods pm 
         JOIN user_bank_details ubd ON pm.id = ubd.payment_method_id 
         WHERE ubd.user_id = ?`,
        [user_id]
      );
      paymentMethods = userPaymentMethods;
    } else {
      // Fetch all payment methods if no user_id is provided
      const [allPaymentMethods] = await db.query(
        "SELECT id, method_name AS name, description FROM payment_methods"
      );
      paymentMethods = allPaymentMethods;
    }

    // Send the payment methods as a response
    res.status(200).json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
};

export const addPaymentMethod = async (req, res) => {
  const { method_name, description } = req.body;

  if (!method_name) {
    return res.status(400).json({ message: "method_name is required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO payment_methods (method_name, description) VALUES (?, ?)",
      [method_name, description || null]
    );
    res.status(201).json({
      message: "Payment method added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    res.status(500).json({ message: "Failed to add payment method" });
  }
};

export const updatePaymentMethod = async (req, res) => {
  const { id } = req.params;
  const { method_name, description } = req.body;

  if (!method_name) {
    return res.status(400).json({ message: "method_name is required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE payment_methods SET method_name = ?, description = ? WHERE id = ?",
      [method_name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    res.status(200).json({ message: "Payment method updated successfully" });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({ message: "Failed to update payment method" });
  }
};

export const deletePaymentMethod = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the payment method is referenced by user_bank_details
    const [checkReference] = await db.query(
      "SELECT COUNT(*) AS count FROM user_bank_details WHERE payment_method_id = ?",
      [id]
    );

    if (checkReference[0].count > 0) {
      return res.status(400).json({
        message:
          "Cannot delete payment method: It is being used by user bank details",
      });
    }

    const [result] = await db.query(
      "DELETE FROM payment_methods WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    res.status(200).json({ message: "Payment method deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({ message: "Failed to delete payment method" });
  }
};
