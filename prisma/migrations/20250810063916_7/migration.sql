/*
  Warnings:

  - Added the required column `instruction` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "instruction" TEXT NOT NULL,
ALTER COLUMN "thumbnail" DROP NOT NULL;
