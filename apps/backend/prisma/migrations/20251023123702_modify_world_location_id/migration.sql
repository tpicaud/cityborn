/*
  Warnings:

  - The primary key for the `WorldLocation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."GuessObject" DROP CONSTRAINT "GuessObject_world_location_id_fkey";

-- AlterTable
ALTER TABLE "GuessObject" ALTER COLUMN "world_location_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "WorldLocation" DROP CONSTRAINT "WorldLocation_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "WorldLocation_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "GuessObject" ADD CONSTRAINT "GuessObject_world_location_id_fkey" FOREIGN KEY ("world_location_id") REFERENCES "WorldLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
