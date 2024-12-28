# Define paths
$rootDir = (Get-Item -Path "..").FullName   # Root directory of shopMalawi
$backendDir = "$rootDir\shopMalawiBackEnd"  # Path for the backend directory

# Navigate to the scripts folder
Set-Location $PSScriptRoot

# Check if the backend directory exists
if (Test-Path $backendDir) {
    Write-Host "Deleting existing backend directory: $backendDir"
    Remove-Item -Recurse -Force $backendDir
}

# Recreate the backend directory
Write-Host "Creating new backend directory: $backendDir"
New-Item -ItemType Directory -Path $backendDir | Out-Null
Set-Location $backendDir

# Initialize a new Node.js project
Write-Host "Initializing Node.js project in $backendDir"
npm init -y | Out-Null

# Rewrite package.json
Write-Host "Rewriting package.json"
@"
{
  "name": "shopmalawibackend",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "mysql2": "^3.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding utf8

# Install dependencies
Write-Host "Installing required dependencies"
npm install express cors dotenv mysql2 | Out-Null

# Install nodemon as a development dependency
Write-Host "Installing nodemon for automatic server restarts"
npm install --save-dev nodemon | Out-Null

# Create nodemon.json file for advanced configuration
Write-Host "Creating nodemon.json"
@"
{
  "watch": ["server.js", "routes", "controllers", "config"],
  "ext": "js,json",
  "ignore": ["node_modules"],
  "exec": "node server.js"
}
"@ | Out-File -FilePath "nodemon.json" -Encoding utf8

# Create subfolders
Write-Host "Creating subdirectories: config, routes, controllers"
New-Item -ItemType Directory -Name "config" | Out-Null
New-Item -ItemType Directory -Name "routes" | Out-Null
New-Item -ItemType Directory -Name "controllers" | Out-Null

# Create main files
Write-Host "Creating main files: server.js, .env"
New-Item -ItemType File -Name "server.js" | Out-Null
New-Item -ItemType File -Name ".env" | Out-Null

# Create db.js file in config folder
Write-Host "Creating config/db.js"
@"
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// Create a connection pool to handle multiple requests efficiently
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Limit the number of concurrent connections
  queueLimit: 0
});

// Export the pool to be used in other parts of the application
const db = pool.promise();

db.getConnection()
  .then(() => console.log("Connected to the MySQL database successfully"))
  .catch(err => console.error("Database connection failed:", err.message));

export default db;
"@ | Out-File -FilePath "config\db.js" -Encoding utf8

# Create products.js file in routes folder
Write-Host "Creating routes/products.js"
@"
import express from 'express';
import { getProducts, addProduct } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/', addProduct);

export default router;
"@ | Out-File -FilePath "routes\products.js" -Encoding utf8

# Create productController.js file in controllers folder
Write-Host "Creating controllers/productController.js"
@"
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
"@ | Out-File -FilePath "controllers\productController.js" -Encoding utf8

# Create server.js file
Write-Host "Creating server.js"
@'
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./routes/products.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);

// Start Server
app.listen(port, () => {
    console.log(`shopMalawiBackEnd running on port ${port}`);
});
'@ | Out-File -FilePath "server.js" -Encoding utf8

# Create .env file with placeholders
Write-Host "Creating .env"
@"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=shopMalawi
DB_PORT=3306
PORT=5000
"@ | Out-File -FilePath ".env" -Encoding utf8

# Navigate back to the scripts folder
Set-Location $PSScriptRoot

Write-Host "Backend setup completed successfully in $backendDir!"
