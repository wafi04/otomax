/*
  Warnings:

  - You are about to drop the `CustomerGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServicePricing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ServicePricing" DROP CONSTRAINT "ServicePricing_customerGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServicePricing" DROP CONSTRAINT "ServicePricing_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_provider_mappings" DROP CONSTRAINT "service_provider_mappings_service_id_fkey";

-- DropTable
DROP TABLE "public"."CustomerGroup";

-- DropTable
DROP TABLE "public"."Service";

-- DropTable
DROP TABLE "public"."ServicePricing";

-- CreateTable
CREATE TABLE "public"."services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "status" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "discount" INTEGER,

    CONSTRAINT "customer_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_pricings" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "customerGroupId" INTEGER NOT NULL,
    "priceSale" INTEGER NOT NULL,
    "profit" INTEGER NOT NULL,
    "isActive" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "services_categoryId_status_idx" ON "public"."services"("categoryId", "status");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "public"."services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_pricings_serviceId_customerGroupId_key" ON "public"."service_pricings"("serviceId", "customerGroupId");

-- AddForeignKey
ALTER TABLE "public"."service_provider_mappings" ADD CONSTRAINT "service_provider_mappings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_pricings" ADD CONSTRAINT "service_pricings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_pricings" ADD CONSTRAINT "service_pricings_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "public"."customer_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
