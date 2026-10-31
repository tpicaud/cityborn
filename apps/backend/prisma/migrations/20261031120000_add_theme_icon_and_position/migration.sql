-- CreateEnum
CREATE TYPE "ThemeIcon" AS ENUM ('BASKETBALL', 'MUSIC', 'CINEMA', 'EDUCATION');

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "icon" "ThemeIcon" NOT NULL DEFAULT 'EDUCATION',
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- UpdateData
UPDATE "Theme" SET "icon" = CASE lower("name")
    WHEN 'sport' THEN 'BASKETBALL'::"ThemeIcon"
    WHEN 'musique' THEN 'MUSIC'::"ThemeIcon"
    WHEN 'divertissement' THEN 'CINEMA'::"ThemeIcon"
    ELSE 'EDUCATION'::"ThemeIcon"
END;

UPDATE "Theme" SET "position" = "ordered"."position"
FROM (
    SELECT "id", ROW_NUMBER() OVER (
        ORDER BY
            CASE lower("name")
                WHEN 'sport' THEN 0
                WHEN 'musique' THEN 1
                WHEN 'divertissement' THEN 2
                WHEN 'éducation' THEN 3
                ELSE 4
            END,
            "id" = '244b803a-63aa-460a-a40d-4eea0ec2be50',
            "name"
    ) - 1 AS "position"
    FROM "Theme"
) AS "ordered"
WHERE "Theme"."id" = "ordered"."id";
