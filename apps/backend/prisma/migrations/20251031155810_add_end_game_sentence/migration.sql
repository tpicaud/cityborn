-- CreateEnum
CREATE TYPE "ScoreType" AS ENUM ('good', 'average', 'bad');

-- CreateTable
CREATE TABLE "EndGameSentence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message" TEXT NOT NULL,
    "score_type" "ScoreType" NOT NULL,

    CONSTRAINT "EndGameSentence_pkey" PRIMARY KEY ("id")
);
