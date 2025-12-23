/*
  Warnings:

  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GuessObject" DROP CONSTRAINT "GuessObject_world_location_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Location" DROP CONSTRAINT "Location_parentId_fkey";

-- DropTable
DROP TABLE "public"."Location";

-- CreateTable
CREATE TABLE "public"."WorldLocation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "public"."LocationType" NOT NULL,
    "level" "public"."LocationLevel",
    "iso_code" TEXT,
    "centroid" DOUBLE PRECISION[],
    "geometry" JSONB NOT NULL,
    "source" JSONB,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorldLocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WorldLocation" ADD CONSTRAINT "WorldLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."WorldLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GuessObject" ADD CONSTRAINT "GuessObject_world_location_id_fkey" FOREIGN KEY ("world_location_id") REFERENCES "public"."WorldLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
