-- AlterTable
ALTER TABLE `hotspots` ADD COLUMN `imageUrls` TEXT NULL,
    ADD COLUMN `metadata` JSON NULL,
    MODIFY `type` ENUM('LINK', 'INFO', 'URL', 'VIDEO', 'LINK_SCENE', 'IMAGE', 'TEXT', 'OTHER') NOT NULL DEFAULT 'LINK';
