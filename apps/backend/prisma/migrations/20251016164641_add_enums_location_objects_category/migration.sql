/*
  Warnings:

  - Changed the type of `mode` on the `GameRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('solo', 'multi');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('area', 'point');

-- CreateEnum
CREATE TYPE "LocationLevel" AS ENUM ('ADM1', 'ADM2', 'ADM3', 'ADM4');

-- 2. Add a new nullable column of the enum type
ALTER TABLE "GameRecord"
ADD COLUMN mode_tmp "GameMode";

-- 3. Convert existing values (strings) to enum
UPDATE "GameRecord"
SET mode_tmp = mode::"GameMode";

-- 4. Drop the old string column
ALTER TABLE "GameRecord"
DROP COLUMN mode;

-- 5. Rename the temporary column to the final name
ALTER TABLE "GameRecord"
RENAME COLUMN mode_tmp TO mode;

-- 6. Make the column NOT NULL (only now that data is filled)
ALTER TABLE "GameRecord"
ALTER COLUMN mode SET NOT NULL;


-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "level" "LocationLevel",
    "iso_code" TEXT,
    "centroid" DOUBLE PRECISION[],
    "geometry" JSONB NOT NULL,
    "source" JSONB,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuessObject" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "short_description" TEXT,
    "world_location_id" UUID NOT NULL,

    CONSTRAINT "GuessObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryGuessObjects" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CategoryGuessObjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryGuessObjects_B_index" ON "_CategoryGuessObjects"("B");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuessObject" ADD CONSTRAINT "GuessObject_world_location_id_fkey" FOREIGN KEY ("world_location_id") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGuessObjects" ADD CONSTRAINT "_CategoryGuessObjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGuessObjects" ADD CONSTRAINT "_CategoryGuessObjects_B_fkey" FOREIGN KEY ("B") REFERENCES "GuessObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
