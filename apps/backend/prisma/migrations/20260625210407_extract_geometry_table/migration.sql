-- CreateTable
CREATE TABLE "WorldLocationGeometry" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "world_location_id" TEXT NOT NULL,

    CONSTRAINT "WorldLocationGeometry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorldLocationGeometry_world_location_id_key" ON "WorldLocationGeometry"("world_location_id");

-- Backfill: copy existing geometry data to the new table before dropping the column
INSERT INTO "WorldLocationGeometry" ("id", "data", "world_location_id")
SELECT gen_random_uuid()::text, "geometry", "id"
FROM "WorldLocation";

-- AddForeignKey
ALTER TABLE "WorldLocationGeometry" ADD CONSTRAINT "WorldLocationGeometry_world_location_id_fkey" FOREIGN KEY ("world_location_id") REFERENCES "WorldLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (drop only after backfill is done)
ALTER TABLE "WorldLocation" DROP COLUMN "geometry";
