#!/bin/bash

DB_NAME="shopMalawi"
DB_USER="root"
DB_PASSWORD="root"

SQL_COMMANDS="
USE \`$DB_NAME\`;

-- First drop events and triggers
DROP EVENT IF EXISTS check_user_presence;
DROP TRIGGER IF EXISTS after_message_insert;
DROP TRIGGER IF EXISTS after_participant_read_update;
DROP TRIGGER IF EXISTS after_user_activity;

-- First remove the foreign key constraint from conversations table
ALTER TABLE conversations 
DROP FOREIGN KEY conversations_ibfk_1;

-- Now drop tables in correct dependency order
DROP TABLE IF EXISTS message_reactions;
DROP TABLE IF EXISTS message_attachments;
DROP TABLE IF EXISTS message_edit_history;
DROP TABLE IF EXISTS conversation_metadata;
DROP TABLE IF EXISTS user_presence;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- Create new tables with updated schema
-- User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
    user_id INT PRIMARY KEY,
    status ENUM('online', 'offline', 'away') DEFAULT 'offline',
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_last_active (last_active)
) ENGINE=InnoDB;

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_id INT DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX (last_message_id),
    INDEX (deleted_at)
) ENGINE=InnoDB;

-- Conversation Metadata Table
CREATE TABLE IF NOT EXISTS conversation_metadata (
    conversation_id INT PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    avatar_url VARCHAR(255),
    is_group BOOLEAN DEFAULT FALSE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_is_group (is_group)
) ENGINE=InnoDB;

-- Conversation Participants Table
CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (conversation_id),
    INDEX (is_archived)
) ENGINE=InnoDB;

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    parent_message_id INT DEFAULT NULL,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed', 'seen') DEFAULT 'pending',
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_conversation_date (conversation_id, created_at),
    INDEX idx_sender_date (sender_id, created_at),
    INDEX idx_delivery_status (delivery_status),
    INDEX idx_parent_message (parent_message_id),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB;

-- Message Edit History Table
CREATE TABLE IF NOT EXISTS message_edit_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    previous_text TEXT NOT NULL,
    edited_by INT NOT NULL,
    edited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_message_date (message_id, edited_at)
) ENGINE=InnoDB;

-- Message Attachments Table
CREATE TABLE IF NOT EXISTS message_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    file_type ENUM('image', 'document', 'audio', 'video', 'other') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX (message_id),
    INDEX (file_type)
) ENGINE=InnoDB;

-- Message Reactions Table
CREATE TABLE IF NOT EXISTS message_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (message_id, user_id),
    INDEX (message_id),
    INDEX (user_id)
) ENGINE=InnoDB;

-- Update last_message_id foreign key
ALTER TABLE conversations 
ADD FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Add triggers for messaging system
DELIMITER //

-- Message System Triggers
CREATE TRIGGER after_message_insert
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    UPDATE conversations 
    SET last_message_id = NEW.id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
END//

-- Add trigger to mark all previous messages as read
CREATE TRIGGER after_participant_read_update
AFTER UPDATE ON conversation_participants
FOR EACH ROW
BEGIN
    IF NEW.last_read_at != OLD.last_read_at THEN
        UPDATE messages 
        SET is_read = TRUE
        WHERE conversation_id = NEW.conversation_id 
        AND sender_id != NEW.user_id
        AND created_at <= NEW.last_read_at;
    END IF;
END//

-- Add triggers for user presence
CREATE TRIGGER after_user_activity
AFTER UPDATE ON conversation_participants
FOR EACH ROW
BEGIN
    UPDATE user_presence 
    SET status = 'online',
        last_active = NOW()
    WHERE user_id = NEW.user_id;
END//

DELIMITER ;

-- Add event for auto-offline
CREATE EVENT IF NOT EXISTS check_user_presence
ON SCHEDULE EVERY 5 MINUTE
DO
    UPDATE user_presence 
    SET status = 'offline'
    WHERE last_active < NOW() - INTERVAL 15 MINUTE
    AND status != 'offline';
"

# Run MySQL commands
echo "Updating message tables in database '$DB_NAME'..."
mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "$SQL_COMMANDS"

if [ $? -eq 0 ]; then
    echo "Message tables updated successfully!"
else
    echo "Failed to update tables. Please check your MySQL credentials and try again."
    exit 1
fi

echo "Update script execution completed."
