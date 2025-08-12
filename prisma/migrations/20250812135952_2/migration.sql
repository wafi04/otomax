/*
  Warnings:

  - You are about to drop the column `createdAt` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `customerGroupId` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `priceSale` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `serviceId` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `service_provider_mappings` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `service_provider_mappings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `service_provider_mappings` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `services` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[service_id,customer_group_id]` on the table `service_pricings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customer_group_id` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_sale` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service_id` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `service_provider_mappings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."service_pricings" DROP CONSTRAINT "service_pricings_customerGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_pricings" DROP CONSTRAINT "service_pricings_serviceId_fkey";

-- DropIndex
DROP INDEX "public"."service_pricings_serviceId_customerGroupId_key";

-- DropIndex
DROP INDEX "public"."services_categoryId_status_idx";

-- AlterTable
ALTER TABLE "public"."service_pricings" DROP COLUMN "createdAt",
DROP COLUMN "customerGroupId",
DROP COLUMN "isActive",
DROP COLUMN "priceSale",
DROP COLUMN "serviceId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customer_group_id" INTEGER NOT NULL,
ADD COLUMN     "is_active" VARCHAR(20) NOT NULL DEFAULT 'active',
ADD COLUMN     "price_sale" INTEGER NOT NULL,
ADD COLUMN     "service_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."service_provider_mappings" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" VARCHAR(10) NOT NULL DEFAULT 'active',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."services" DROP COLUMN "categoryId",
DROP COLUMN "createdAt",
DROP COLUMN "logoUrl",
DROP COLUMN "updatedAt",
ADD COLUMN     "category_id" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_pricings_service_id_customer_group_id_key" ON "public"."service_pricings"("service_id", "customer_group_id");

-- CreateIndex
CREATE INDEX "services_category_id_status_idx" ON "public"."services"("category_id", "status");

-- AddForeignKey
ALTER TABLE "public"."service_pricings" ADD CONSTRAINT "service_pricings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_pricings" ADD CONSTRAINT "service_pricings_customer_group_id_fkey" FOREIGN KEY ("customer_group_id") REFERENCES "public"."customer_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
