-- Initialize Panoramate Database
-- This script runs on first container startup

-- Ensure UTF-8 character set for panoramate database
ALTER DATABASE panoramate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create initial schema (Prisma will handle this)
-- This is just a placeholder for any custom initialization

-- Grant privileges
GRANT ALL PRIVILEGES ON panoramate.* TO 'panoramate_user'@'%';
FLUSH PRIVILEGES;
