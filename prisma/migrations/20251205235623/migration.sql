-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "TypeAnswerGame" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "backgroundUrl" TEXT,
    "timeLimitSec" INTEGER NOT NULL,
    "pointsPerQuestion" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeAnswerGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeAnswerQuestion" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "TypeAnswerQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TypeAnswerGame" ADD CONSTRAINT "TypeAnswerGame_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GameTemplates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeAnswerGame" ADD CONSTRAINT "TypeAnswerGame_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeAnswerQuestion" ADD CONSTRAINT "TypeAnswerQuestion_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "TypeAnswerGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
