/*
  Warnings:

  - Added the required column `image` to the `Method` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Method" ADD COLUMN     "image" TEXT NOT NULL;
