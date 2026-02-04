/*
  Warnings:

  - The `tipoPersona` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('JURIDICA', 'FISICA');

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "tipoPersona",
ADD COLUMN     "tipoPersona" "TipoPersona";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
