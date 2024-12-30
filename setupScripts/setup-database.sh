#!/bin/bash

# Set MySQL credentials
DB_NAME="shopMalawi"
DB_USER="root"
DB_PASSWORD="root"

# SQL commands to create the database and table
SQL_COMMANDS="
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
USE $DB_NAME;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image LONGBLOB NOT NULL
);
"

# Run MySQL commands
echo "Setting up the database '$DB_NAME'..."

mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "$SQL_COMMANDS"

if [ $? -eq 0 ]; then
    echo "Database setup completed successfully!"
else
    echo "Failed to set up the database. Please check your MySQL credentials and try again."
fi