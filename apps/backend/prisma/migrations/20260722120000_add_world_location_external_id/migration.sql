-- AlterTable: add external_id as nullable first so existing rows can be backfilled
ALTER TABLE "WorldLocation" ADD COLUMN "external_id" TEXT;

-- Backfill from the existing source JSON payload; fall back to the row's own id
-- for rows that predate `source` being populated (id was historically supplied
-- by the client from the same external OSM/Nominatim identifier).
UPDATE "WorldLocation"
SET "external_id" = COALESCE(source->>'external_id', id)
WHERE "external_id" IS NULL;

-- AlterTable
ALTER TABLE "WorldLocation" ALTER COLUMN "external_id" SET NOT NULL;

-- CreateIndex
-- NOTE: this will fail if two existing rows already share the same
-- (osm_type, external_id) pair (i.e. the same real-world place was persisted
-- twice under different WorldLocation ids). If it fails, those duplicates must
-- be manually reconciled (merge GuessObject.world_location_id references and
-- delete the duplicate row) before this migration can be applied.
CREATE UNIQUE INDEX "WorldLocation_osm_type_external_id_key" ON "WorldLocation"("osm_type", "external_id");
