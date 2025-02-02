// controllers/bankDetailsController.js
import db from "../config/db.js";

// Add Bank Details
export const addBankDetails = async (req, res) => {
  const {
    user_id,
    payment_method_id,
    account_number,
    account_holder_name,
    branch_code,
  } = req.body;

  if (
    !user_id ||
    !payment_method_id ||
    !account_number ||
    !account_holder_name
  ) {
    return res.status(400).json({
      message:
        "user_id, payment_method_id, account_number, and account_holder_name are required",
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO user_bank_details (user_id, payment_method_id, account_number, account_holder_name, branch_code)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        payment_method_id,
        account_number,
        account_holder_name,
        branch_code || null,
      ]
    );

    res.status(201).json({
      message: "Bank details added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding bank details:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Duplicate entry: Account number already exists." });
    }
    res.status(500).json({ message: "Failed to add bank details" });
  }
};

// Get Bank Details
export const getBankDetails = async (req, res) => {
  // Optionally filter by user_id or payment_method_id (if provided via query params)
  const { user_id, payment_method_id } = req.query;
  let query = `
    SELECT ubd.*, pm.method_name AS payment_method_name
    FROM user_bank_details ubd
    JOIN payment_methods pm ON ubd.payment_method_id = pm.id
  `;
  const conditions = [];
  const params = [];

  if (user_id) {
    conditions.push("ubd.user_id = ?");
    params.push(user_id);
  }
  if (payment_method_id) {
    conditions.push("ubd.payment_method_id = ?");
    params.push(payment_method_id);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  try {
    const [results] = await db.query(query, params);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({ message: "Failed to fetch bank details" });
  }
};

// Update Bank Details
export const updateBankDetails = async (req, res) => {
  const { id } = req.params;
  const {
    user_id,
    payment_method_id,
    account_number,
    account_holder_name,
    branch_code,
  } = req.body;

  if (
    !user_id ||
    !payment_method_id ||
    !account_number ||
    !account_holder_name
  ) {
    return res.status(400).json({
      message:
        "user_id, payment_method_id, account_number, and account_holder_name are required",
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE user_bank_details
       SET user_id = ?, payment_method_id = ?, account_number = ?, account_holder_name = ?, branch_code = ?
       WHERE id = ?`,
      [
        user_id,
        payment_method_id,
        account_number,
        account_holder_name,
        branch_code || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    res.status(200).json({ message: "Bank details updated successfully" });
  } catch (error) {
    console.error("Error updating bank details:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ message: "Duplicate entry: Account number already exists." });
    }
    res.status(500).json({ message: "Failed to update bank details" });
  }
};

// Delete Bank Details
export const deleteBankDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM user_bank_details WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    res.status(200).json({ message: "Bank details deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank details:", error);
    res.status(500).json({ message: "Failed to delete bank details" });
  }
};
