-- ==============================================
-- MiniSocialNetwork Database Setup Script
-- ==============================================

-- 1. Create database
CREATE DATABASE IF NOT EXISTS socialnetwork 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- 2. Create user and grant privileges
CREATE USER IF NOT EXISTS 'socialuser'@'localhost' IDENTIFIED BY 'socialpass';
CREATE USER IF NOT EXISTS 'socialuser'@'%' IDENTIFIED BY 'socialpass';

GRANT ALL PRIVILEGES ON socialnetwork.* TO 'socialuser'@'localhost';
GRANT ALL PRIVILEGES ON socialnetwork.* TO 'socialuser'@'%';
FLUSH PRIVILEGES;

-- 3. Use database
USE socialnetwork;

-- ==============================================
-- Tables will be auto-created by Hibernate
-- with spring.jpa.hibernate.ddl-auto=update
-- ==============================================

-- Manual table creation (optional - only if ddl-auto is disabled)
-- 
-- CREATE TABLE user_follows (
--     follower_id BIGINT NOT NULL,
--     following_id BIGINT NOT NULL,
--     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     PRIMARY KEY (follower_id, following_id)
-- );
