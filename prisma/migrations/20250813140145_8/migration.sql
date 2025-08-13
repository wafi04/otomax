/*
  Warnings:

  - You are about to drop the column `customer_group_id` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `price_sale` on the `service_pricings` table. All the data in the column will be lost.
  - You are about to drop the column `profit` on the `service_pricings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[service_id]` on the table `service_pricings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price_platinum` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_reseller` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_user` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profit_platinum` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profit_reseller` to the `service_pricings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profit_user` to the `service_pricings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."service_pricings" DROP CONSTRAINT "service_pricings_customer_group_id_fkey";

-- DropIndex
DROP INDEX "public"."service_pricings_service_id_customer_group_id_key";

-- AlterTable
ALTER TABLE "public"."service_pricings" DROP COLUMN "customer_group_id",
DROP COLUMN "price_sale",
DROP COLUMN "profit",
ADD COLUMN     "price_platinum" INTEGER NOT NULL,
ADD COLUMN     "price_reseller" INTEGER NOT NULL,
ADD COLUMN     "price_user" INTEGER NOT NULL,
ADD COLUMN     "profit_platinum" INTEGER NOT NULL,
ADD COLUMN     "profit_reseller" INTEGER NOT NULL,
ADD COLUMN     "profit_user" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_pricings_service_id_key" ON "public"."service_pricings"("service_id");
