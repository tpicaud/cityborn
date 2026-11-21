-- CreateTable
CREATE TABLE "CatalogSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CatalogSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogSection_name_case_insensitive_key" ON "CatalogSection" (lower("name"));
