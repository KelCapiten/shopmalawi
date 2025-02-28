#!/bin/bash

# Set MySQL credentials
DB_NAME="shopMalawi"
DB_USER="root"
DB_PASSWORD="root"
BACKUP_FILE="./shopMalawi28_2025.sql"

echo "Starting data migration from backup..."

# Create temporary SQL file for locations and categories
echo "Extracting locations and categories from backup..."
sed -n '/^-- Table structure for table `locations`/,/^-- Table structure/p' "$BACKUP_FILE" > temp_locations.sql
sed -n '/^-- Table structure for table `categories`/,/^-- Table structure/p' "$BACKUP_FILE" > temp_categories.sql

# Import the data
echo "Importing locations and categories to $DB_NAME..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF
SET foreign_key_checks = 0;
SOURCE temp_locations.sql;
SOURCE temp_categories.sql;
SET foreign_key_checks = 1;
EOF

# Clean up temporary files
rm temp_locations.sql temp_categories.sql

if [ $? -eq 0 ]; then
    echo "Data migration completed successfully!"
else
    echo "Failed to migrate data. Please check your MySQL credentials and backup file path."
    exit 1
fi
