/*
  Warnings:

  - A unique constraint covering the columns `[uuid]` on the table `GameRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "public"."GameRecordUser" (
    "userId" UUID NOT NULL,
    "gameRecordId" UUID NOT NULL,

    CONSTRAINT "GameRecordUser_pkey" PRIMARY KEY ("userId","gameRecordId")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRecord_uuid_key" ON "public"."GameRecord"("uuid");

-- AddForeignKey
ALTER TABLE "public"."GameRecordUser" ADD CONSTRAINT "GameRecordUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameRecordUser" ADD CONSTRAINT "GameRecordUser_gameRecordId_fkey" FOREIGN KEY ("gameRecordId") REFERENCES "public"."GameRecord"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
