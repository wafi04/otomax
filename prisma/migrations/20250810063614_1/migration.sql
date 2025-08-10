/*
  Warnings:

  - Added the required column `placeholder_1` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placeholder_2` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "placeholder_1" VARCHAR(30) NOT NULL,
ADD COLUMN     "placeholder_2" VARCHAR(30) NOT NULL,
ADD COLUMN     "thumbnail" TEXT NOT NULL;
