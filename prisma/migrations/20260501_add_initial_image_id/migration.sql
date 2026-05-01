-- AlterTable
ALTER TABLE `tours` ADD COLUMN `initialImageId` VARCHAR(191) NULL,
ADD CONSTRAINT `tours_initialImageId_fkey` FOREIGN KEY (`initialImageId`) REFERENCES `tour_images`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
