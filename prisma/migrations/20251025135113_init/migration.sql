/*
  Warnings:

  - The values [staff] on the enum `hospitalRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `hospitalId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hospitalName` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Hospital` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "hospitalRole_new" AS ENUM ('admin', 'doctor', 'nurse', 'patient', 'pharmacist');
ALTER TABLE "public"."HospitalUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "HospitalUser" ALTER COLUMN "role" TYPE "hospitalRole_new" USING ("role"::text::"hospitalRole_new");
ALTER TYPE "hospitalRole" RENAME TO "hospitalRole_old";
ALTER TYPE "hospitalRole_new" RENAME TO "hospitalRole";
DROP TYPE "public"."hospitalRole_old";
ALTER TABLE "HospitalUser" ALTER COLUMN "role" SET DEFAULT 'patient';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_hospitalId_fkey";

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "hospitalId",
DROP COLUMN "hospitalName";

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
