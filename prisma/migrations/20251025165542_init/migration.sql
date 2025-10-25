/*
  Warnings:

  - The values [vet] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `LivestockRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vet` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('superAdmin', 'government', 'hospital', 'pharmacist', 'airport_verifier');
ALTER TABLE "RolePermission" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."LivestockRecord" DROP CONSTRAINT "LivestockRecord_vetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Vet" DROP CONSTRAINT "Vet_hospitalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Vet" DROP CONSTRAINT "Vet_userId_fkey";

-- DropTable
DROP TABLE "public"."LivestockRecord";

-- DropTable
DROP TABLE "public"."Vet";
