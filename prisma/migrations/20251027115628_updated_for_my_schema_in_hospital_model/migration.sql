/*
  Warnings:

  - A unique constraint covering the columns `[nationalId]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseNo]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseNo]` on the table `Hospital` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `result` on the `AirportCheck` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `licenseExpiryDate` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseNo` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseTakeDate` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationalId` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseExpiryDate` to the `Hospital` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseNo` to the `Hospital` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseTakeDate` to the `Hospital` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "resultCheck" AS ENUM ('verify', 'failed');

-- AlterTable
ALTER TABLE "AirportCheck" DROP COLUMN "result",
ADD COLUMN     "result" "resultCheck" NOT NULL;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "licenseNo" TEXT NOT NULL,
ADD COLUMN     "licenseTakeDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "nationalId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "licenseNo" TEXT NOT NULL,
ADD COLUMN     "licenseTakeDate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_nationalId_key" ON "Doctor"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_licenseNo_key" ON "Doctor"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_licenseNo_key" ON "Hospital"("licenseNo");
