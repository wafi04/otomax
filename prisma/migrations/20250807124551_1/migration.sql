-- CreateTable
CREATE TABLE "public"."Method" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "grub_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "min_amount" INTEGER NOT NULL,
    "max_amount" INTEGER NOT NULL,
    "fee" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Method_pkey" PRIMARY KEY ("id")
);
