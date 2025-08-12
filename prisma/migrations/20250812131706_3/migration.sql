/*
  Warnings:

  - You are about to drop the column `purchaseBuy` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "purchaseBuy";

-- CreateTable
CREATE TABLE "public"."service_provider_mappings" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "provider_price" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_provider_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_providers" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "is_active" VARCHAR(10) NOT NULL DEFAULT 'active',
    "base_url" TEXT,
    "api_username" TEXT,
    "api_key" TEXT,
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_provider_mappings_provider_provider_id_idx" ON "public"."service_provider_mappings"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "service_provider_mappings_service_id_idx" ON "public"."service_provider_mappings"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_provider_mappings_service_id_provider_id_provider_key" ON "public"."service_provider_mappings"("service_id", "provider_id", "provider");

-- CreateIndex
CREATE INDEX "service_providers_provider_code_idx" ON "public"."service_providers"("provider", "code");

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_provider_code_key" ON "public"."service_providers"("provider", "code");

-- CreateIndex
CREATE INDEX "Service_categoryId_status_idx" ON "public"."Service"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Service_name_idx" ON "public"."Service"("name");

-- AddForeignKey
ALTER TABLE "public"."service_provider_mappings" ADD CONSTRAINT "service_provider_mappings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
