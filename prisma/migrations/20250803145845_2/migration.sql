-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sub_name" TEXT NOT NULL,
    "code" TEXT,
    "brand" TEXT NOT NULL,
    "desc" TEXT,
    "requestBy" CHAR(200),
    "is_check_nickname" CHAR(10) NOT NULL,
    "status" CHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "public"."categories"("code");

-- CreateIndex
CREATE INDEX "categories_status_code_idx" ON "public"."categories"("status", "code");
