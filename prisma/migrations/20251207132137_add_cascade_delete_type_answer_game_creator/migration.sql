-- DropForeignKey
ALTER TABLE "TypeAnswerGame" DROP CONSTRAINT "TypeAnswerGame_creatorId_fkey";

-- AddForeignKey
ALTER TABLE "TypeAnswerGame" ADD CONSTRAINT "TypeAnswerGame_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
