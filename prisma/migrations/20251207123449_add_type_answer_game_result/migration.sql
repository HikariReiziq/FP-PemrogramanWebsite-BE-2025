-- CreateTable
CREATE TABLE "TypeAnswerGameResult" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "completionTime" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TypeAnswerGameResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TypeAnswerGameResult_gameId_score_completionTime_idx" ON "TypeAnswerGameResult"("gameId", "score", "completionTime");

-- AddForeignKey
ALTER TABLE "TypeAnswerGameResult" ADD CONSTRAINT "TypeAnswerGameResult_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TypeAnswerGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeAnswerGameResult" ADD CONSTRAINT "TypeAnswerGameResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
