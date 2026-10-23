-- CreateTable
CREATE TABLE "Theme" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_name_key" ON "Theme"("name");

-- InsertData
INSERT INTO "Theme" ("id", "name") VALUES
    ('244b803a-63aa-460a-a40d-4eea0ec2be50', 'Divers'),
    (gen_random_uuid(), 'Sport'),
    (gen_random_uuid(), 'Divertissement'),
    (gen_random_uuid(), 'Éducation'),
    (gen_random_uuid(), 'Musique');

-- AlterTable
ALTER TABLE "Pack" ADD COLUMN     "themeId" UUID NOT NULL DEFAULT '244b803a-63aa-460a-a40d-4eea0ec2be50';

-- CreateIndex
CREATE INDEX "Pack_themeId_idx" ON "Pack"("themeId");

-- AddForeignKey
ALTER TABLE "Pack" ADD CONSTRAINT "Pack_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
