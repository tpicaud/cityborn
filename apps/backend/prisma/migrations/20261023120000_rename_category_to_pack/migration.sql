-- RenameTable
ALTER TABLE "Category" RENAME TO "Pack";
ALTER TABLE "Pack" RENAME CONSTRAINT "Category_pkey" TO "Pack_pkey";
ALTER TABLE "Pack" RENAME CONSTRAINT "Category_parentId_fkey" TO "Pack_parentId_fkey";
ALTER INDEX "Category_parentId_idx" RENAME TO "Pack_parentId_idx";

-- RenameTable
ALTER TABLE "_CategoryGuessObjects" RENAME TO "_PackGuessObjects";
ALTER TABLE "_PackGuessObjects" DROP CONSTRAINT "_CategoryGuessObjects_AB_pkey";
DROP INDEX "_CategoryGuessObjects_B_index";
ALTER TABLE "_PackGuessObjects" RENAME COLUMN "A" TO "packId";
ALTER TABLE "_PackGuessObjects" RENAME COLUMN "B" TO "A";
ALTER TABLE "_PackGuessObjects" RENAME COLUMN "packId" TO "B";
ALTER TABLE "_PackGuessObjects" RENAME CONSTRAINT "_CategoryGuessObjects_A_fkey" TO "_PackGuessObjects_B_fkey";
ALTER TABLE "_PackGuessObjects" RENAME CONSTRAINT "_CategoryGuessObjects_B_fkey" TO "_PackGuessObjects_A_fkey";
ALTER TABLE "_PackGuessObjects" ADD CONSTRAINT "_PackGuessObjects_AB_pkey" PRIMARY KEY ("A", "B");
CREATE INDEX "_PackGuessObjects_B_index" ON "_PackGuessObjects"("B");

-- MigrateData
UPDATE "GameRecord"
SET "gameConfig" = ("gameConfig" - 'categories') || jsonb_build_object('packs', "gameConfig" -> 'categories')
WHERE "gameConfig" ? 'categories';

UPDATE "Event"
SET "properties" = ("properties" - 'categories') || jsonb_build_object('packs', "properties" -> 'categories')
WHERE "name" = 'game_started' AND "properties" ? 'categories';
