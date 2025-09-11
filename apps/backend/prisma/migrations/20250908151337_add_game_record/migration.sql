-- CreateTable
CREATE TABLE "public"."GameRecord" (
    "id" SERIAL NOT NULL,
    "mode" TEXT NOT NULL,
    "gameConfig" JSONB NOT NULL,
    "guessObjectsIds" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_Players" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Players_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_Players_B_index" ON "public"."_Players"("B");

-- AddForeignKey
ALTER TABLE "public"."_Players" ADD CONSTRAINT "_Players_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."GameRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_Players" ADD CONSTRAINT "_Players_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
