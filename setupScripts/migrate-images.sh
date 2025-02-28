#!/bin/bash

DB_NAME="shopMalawi"
DB_USER="root"
DB_PASSWORD="root"
BACKUP_FILE="/tmp/${DB_NAME}_backup.sql"

# Create database backup
echo "Creating database backup..."
mysqldump -u"$DB_USER" -p"$DB_PASSWORD" $DB_NAME > $BACKUP_FILE

if [ $? -ne 0 ]; then
    echo "Backup failed. Aborting migration."
    exit 1
fi

# Attempt migration
echo "Starting migration..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" $DB_NAME << EOF
SET FOREIGN_KEY_CHECKS=0;

-- Modify images table to accept both existing and new types
ALTER TABLE images 
MODIFY COLUMN imageable_type ENUM('product', 'inquiry', 'store', 'event', 'user', 'system', 'payment') NOT NULL;

-- Migrate data from other tables
INSERT INTO images (imageable_id, imageable_type, image_path, alt_text, created_at)
SELECT id, 'system', image_path, alt_text, created_at FROM system_images;

INSERT INTO images (imageable_id, imageable_type, image_path, alt_text, created_at)
SELECT id, 'payment', image_path, alt_text, created_at FROM payment_screenshots;

INSERT INTO images (imageable_id, imageable_type, image_path, alt_text, created_at)
SELECT user_id, 'user', image_path, alt_text, created_at FROM user_images;

-- Update foreign key references
UPDATE payments p
JOIN payment_screenshots ps ON p.payment_screenshots_id = ps.id
JOIN images i ON i.image_path = ps.image_path AND i.imageable_type = 'payment'
SET p.payment_screenshots_id = i.id;

UPDATE refunds r
JOIN payment_screenshots ps ON r.payment_screenshots_id = ps.id
JOIN images i ON i.image_path = ps.image_path AND i.imageable_type = 'payment'
SET r.payment_screenshots_id = i.id;

-- Update constraints with unique names
ALTER TABLE payments
DROP FOREIGN KEY payments_ibfk_3,
ADD CONSTRAINT fk_payments_images FOREIGN KEY (payment_screenshots_id) REFERENCES images(id);

ALTER TABLE refunds
DROP FOREIGN KEY refunds_ibfk_2,
ADD CONSTRAINT fk_refunds_images FOREIGN KEY (payment_screenshots_id) REFERENCES images(id);

-- Drop old tables
DROP TABLE user_images;
DROP TABLE system_images;
DROP TABLE payment_screenshots;

SET FOREIGN_KEY_CHECKS=1;
EOF

if [ $? -ne 0 ]; then
    echo "Migration failed. Restoring from backup..."
    mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "DROP DATABASE $DB_NAME; CREATE DATABASE $DB_NAME;"
    mysql -u"$DB_USER" -p"$DB_PASSWORD" $DB_NAME < $BACKUP_FILE
    rm $BACKUP_FILE
    echo "Database restored to original state."
    exit 1
else
    echo "Migration completed successfully!"
    rm $BACKUP_FILE
fi
