-- AlterTable
ALTER TABLE "public"."categories" ALTER COLUMN "requestBy" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "is_check_nickname" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(20);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchaseBuy" INTEGER NOT NULL,
    "priceSale" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);
