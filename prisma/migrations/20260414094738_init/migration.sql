-- CreateTable
CREATE TABLE `Article` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `slug` VARCHAR(500) NOT NULL,
    `summary` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `imageUrl` VARCHAR(1000) NULL,
    `category` VARCHAR(100) NOT NULL,
    `tags` TEXT NOT NULL,
    `source` VARCHAR(500) NULL,
    `sourceUrl` VARCHAR(1000) NULL,
    `readingTime` INTEGER NOT NULL DEFAULT 3,
    `promoted` BOOLEAN NOT NULL DEFAULT false,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Article_slug_key`(`slug`),
    INDEX `Article_category_idx`(`category`),
    INDEX `Article_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchLog` (
    `id` VARCHAR(191) NOT NULL,
    `query` VARCHAR(500) NOT NULL,
    `results` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
