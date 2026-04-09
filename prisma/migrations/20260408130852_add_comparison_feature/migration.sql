-- CreateTable
CREATE TABLE `comparisons` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `comparisons_organizationId_fkey`(`organizationId`),
    INDEX `comparisons_createdById_fkey`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comparison_images` (
    `id` VARCHAR(191) NOT NULL,
    `comparisonId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL DEFAULT 'image/jpeg',
    `sizeMb` DOUBLE NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `captureDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comparison_images_comparisonId_fkey`(`comparisonId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `comparisons` ADD CONSTRAINT `comparisons_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comparisons` ADD CONSTRAINT `comparisons_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comparison_images` ADD CONSTRAINT `comparison_images_comparisonId_fkey` FOREIGN KEY (`comparisonId`) REFERENCES `comparisons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
