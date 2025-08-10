/*
  Warnings:

  - You are about to drop the column `image` on the `categories` table. All the data in the column will be lost.
  - Added the required column `information` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."categories" DROP COLUMN "image",
ADD COLUMN     "information" TEXT NOT NULL;
