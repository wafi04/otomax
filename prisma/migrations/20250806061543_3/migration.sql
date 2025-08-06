/*
  Warnings:

  - You are about to drop the column `priceSale` on the `Service` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "priceSale",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."CustomerGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "discount" INTEGER,

    CONSTRAINT "CustomerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServicePricing" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "customerGroupId" INTEGER NOT NULL,
    "priceSale" INTEGER NOT NULL,
    "profit" INTEGER NOT NULL,
    "isActive" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePricing_serviceId_customerGroupId_key" ON "public"."ServicePricing"("serviceId", "customerGroupId");

-- AddForeignKey
ALTER TABLE "public"."ServicePricing" ADD CONSTRAINT "ServicePricing_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServicePricing" ADD CONSTRAINT "ServicePricing_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "public"."CustomerGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
