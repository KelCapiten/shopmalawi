import db from "../config/db.js";

export const getPaymentMethods = async (req, res) => {
  try {
    // Fetch all payment methods from the database
    const [paymentMethods] = await db.query(
      "SELECT id, method_name AS name, description FROM payment_methods"
    );

    // Send the payment methods as a response
    res.status(200).json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
};
