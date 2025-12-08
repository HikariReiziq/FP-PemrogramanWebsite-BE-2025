import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

const join = (...args: string[]) => path.join(...args);

const prisma = new PrismaClient();

async function exportTypeAnswerData() {
  try {
    const games = await prisma.typeAnswerGame.findMany({
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Get all results separately
    const allResults = await prisma.typeAnswerGameResult.findMany({
      include: {
        player: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    // Export Type Answer Games CSV
    const gamesCSV = [
      'id,templateId,creatorId,creator_username,title,description,thumbnailUrl,timeLimitSec,pointsPerQuestion,status,publishedAt,createdAt,updatedAt',
    ];

    for (const game of games) {
      gamesCSV.push(
        [
          game.id,
          game.templateId,
          game.creatorId,
          game.creator.username,
          `"${game.title.replaceAll('"', '""')}"`,
          `"${game.description.replaceAll('"', '""')}"`,
          game.thumbnailUrl,
          game.timeLimitSec,
          game.pointsPerQuestion,
          game.status,
          game.publishedAt ? game.publishedAt.toISOString() : '',
          game.createdAt.toISOString(),
          game.updatedAt.toISOString(),
        ].join(','),
      );
    }

    // Export Type Answer Questions CSV
    const questionsCSV = ['id,gameId,order,text,answer'];

    for (const game of games) {
      for (const question of game.questions) {
        questionsCSV.push(
          [
            question.id,
            question.gameId,
            question.order,
            `"${question.text.replaceAll('"', '""')}"`,
            `"${question.answer.replaceAll('"', '""')}"`,
          ].join(','),
        );
      }
    }

    // Export Type Answer Results CSV
    const resultsCSV = [
      'id,gameId,playerId,player_username,score,correctAnswers,totalQuestions,completionTime,percentage,createdAt',
    ];

    for (const result of allResults) {
      resultsCSV.push(
        [
          result.id,
          result.gameId,
          result.playerId,
          result.player.username,
          result.score,
          result.correctAnswers,
          result.totalQuestions,
          result.completionTime,
          result.percentage,
          result.createdAt.toISOString(),
        ].join(','),
      );
    }

    // Write CSV files
    const dataDirectory = join(process.cwd(), 'prisma', 'seeder', 'data');

    writeFileSync(
      join(dataDirectory, 'type-answer-games.data.csv'),
      gamesCSV.join('\n'),
    );
    console.log(
      `✅ Exported ${games.length} Type Answer Games to type-answer-games.data.csv`,
    );

    const totalQuestions = games.reduce(
      (sum, g) => sum + g.questions.length,
      0,
    );
    writeFileSync(
      join(dataDirectory, 'type-answer-questions.data.csv'),
      questionsCSV.join('\n'),
    );
    console.log(
      `✅ Exported ${totalQuestions} Type Answer Questions to type-answer-questions.data.csv`,
    );

    writeFileSync(
      join(dataDirectory, 'type-answer-results.data.csv'),
      resultsCSV.join('\n'),
    );
    console.log(
      `✅ Exported ${allResults.length} Type Answer Results to type-answer-results.data.csv`,
    );

    console.log('\n📊 Summary:');
    console.log(`   Games: ${games.length}`);
    console.log(`   Questions: ${totalQuestions}`);
    console.log(`   Results: ${allResults.length}`);
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

await exportTypeAnswerData();
