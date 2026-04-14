-- AlterTable
ALTER TABLE `Article` ADD COLUMN `authorId` VARCHAR(191) NULL,
    ADD COLUMN `isDraft` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `visibility` ENUM('PUBLIC', 'PROFILE_ONLY') NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Vote` ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'CREATOR', 'PLUS', 'READER') NOT NULL DEFAULT 'READER',
    `onboardingComplete` BOOLEAN NOT NULL DEFAULT false,
    `preferredCategories` TEXT NULL,
    `aiArticlesUsedToday` INTEGER NOT NULL DEFAULT 0,
    `aiArticlesResetDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creatorArticlesUsedMonth` INTEGER NOT NULL DEFAULT 0,
    `creatorArticlesResetDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Session_token_key`(`token`),
    INDEX `Session_token_idx`(`token`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Article_authorId_idx` ON `Article`(`authorId`);

-- CreateIndex
CREATE INDEX `Comment_userId_idx` ON `Comment`(`userId`);

-- CreateIndex
CREATE INDEX `Vote_userId_idx` ON `Vote`(`userId`);

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
