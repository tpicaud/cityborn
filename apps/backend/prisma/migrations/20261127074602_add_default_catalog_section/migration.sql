-- InsertData
INSERT INTO "CatalogSection" ("id", "name", "position")
SELECT '9c3f6b1e-2d4a-4e8b-a7c5-1f0e9d8b7a63', 'Tous les packs', COALESCE(MIN("position"), 1) - 1
FROM "CatalogSection";
