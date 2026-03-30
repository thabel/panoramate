-- AlterTable
ALTER TABLE `tours` ADD COLUMN `backgroundAudioUrl` TEXT NULL,
    ADD COLUMN `backgroundAudioVolume` DOUBLE NOT NULL DEFAULT 0.5;
