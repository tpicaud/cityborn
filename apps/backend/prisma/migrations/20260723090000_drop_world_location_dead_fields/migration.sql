-- Backfill: reconstruct a minimal source for any row that predates
-- `source` being populated, using the external_id column already backfilled
-- by the previous migration, before making `source` NOT NULL.
UPDATE "WorldLocation"
SET source = jsonb_build_object('provider', 'unknown', 'external_id', external_id)
WHERE source IS NULL;

-- AlterTable: type/level/iso_code were never actually populated (the only
-- real creation path, Nominatim, never sets level/iso_code, and `type` just
-- duplicated `geometry.type`) and were never read anywhere in the app.
ALTER TABLE "WorldLocation"
  DROP COLUMN "type",
  DROP COLUMN "level",
  DROP COLUMN "iso_code",
  ALTER COLUMN "source" SET NOT NULL;

-- DropEnum
DROP TYPE "LocationType";
DROP TYPE "LocationLevel";
