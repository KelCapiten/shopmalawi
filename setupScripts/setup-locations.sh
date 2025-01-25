#!/bin/bash

# Set MySQL credentials
DB_NAME="shopMalawi"
DB_USER="root"
DB_PASSWORD="root"

# List of all updated districts in Malawi
DISTRICTS=(
    "Balaka" "Blantyre" "Chikwawa" "Chiradzulu" "Chitipa" "Dedza"
    "Dowa" "Karonga" "Kasungu" "Likoma" "Lilongwe" "Machinga"
    "Mangochi" "Mchinji" "Mulanje" "Mwanza" "Mzimba Boma"
    "Mzuzu" "Neno" "Nkhatabay" "Nkhotakota" "Nsanje" "Ntcheu"
    "Ntchisi" "Phalombe" "Rumphi" "Salima" "Thyolo" "Zomba"
)

# Generate SQL commands to insert districts into locations table
SQL_COMMANDS="USE \`$DB_NAME\`;"

for DISTRICT in "${DISTRICTS[@]}"; do
    SQL_COMMANDS+="INSERT INTO locations (name) VALUES ('$DISTRICT') ON DUPLICATE KEY UPDATE name=name;"
done

# Run MySQL commands to insert districts
echo "Adding updated districts to the 'locations' table in database '$DB_NAME'..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "$SQL_COMMANDS"

if [ $? -eq 0 ]; then
    echo "Updated districts added to the 'locations' table successfully!"
else
    echo "Failed to add updated districts. Please check your MySQL credentials and table schema."
    exit 1
fi

echo "Script execution completed."
