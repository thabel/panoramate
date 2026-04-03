-- AlterTable
ALTER TABLE `hotspots` ADD COLUMN `imageUrl` TEXT NULL,
    MODIFY `color` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tours` ADD COLUMN `showHotspotTitles` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `showSceneMenu` BOOLEAN NOT NULL DEFAULT true;
