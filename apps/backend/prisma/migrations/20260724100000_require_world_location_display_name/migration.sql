-- Backfill: fall back to `name` for any row that predates display_name
-- being populated, before making the column NOT NULL.
UPDATE "WorldLocation"
SET display_name = name
WHERE display_name IS NULL;

-- AlterTable
ALTER TABLE "WorldLocation" ALTER COLUMN "display_name" SET NOT NULL;
