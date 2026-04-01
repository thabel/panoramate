-- CreateEnum for AnimationType
CREATE TYPE `AnimationType` AS ENUM ('NONE', 'PULSE', 'GLOW', 'BOUNCE', 'FLOAT');

-- AlterTable hotspots
ALTER TABLE `hotspots`
ADD COLUMN `animationType` ENUM('NONE', 'PULSE', 'GLOW', 'BOUNCE', 'FLOAT') NOT NULL DEFAULT 'NONE',
ADD COLUMN `iconUrl` TEXT NULL,
ADD COLUMN `color` VARCHAR(7) NULL,
ADD COLUMN `scale` DOUBLE NOT NULL DEFAULT 1.0;
