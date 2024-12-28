import db from '../config/db.js';

// Get All Products
export const getProducts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a Product
export const addProduct = async (req, res) => {
    const { name, price } = req.body;
    try {
        const [result] = await db.query('INSERT INTO products (name, price) VALUES (?, ?)', [name, price]);
        res.json({ id: result.insertId, name, price });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
