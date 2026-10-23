DROP INDEX "Theme_name_key";
CREATE UNIQUE INDEX "Theme_name_case_insensitive_key" ON "Theme" (lower("name"));
