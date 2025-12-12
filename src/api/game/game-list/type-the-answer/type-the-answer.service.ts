// src/api/game/game-list/type-the-answer/type-the-answer.service.ts
import { type GameStatus, type Prisma } from '@prisma/client'; // kalau ada enum GameStatus di Prisma

import { ErrorResponse, prisma } from '@/common';
import { FileManager } from '@/utils';
import { syncTypeAnswerCSV } from '@/utils/csv-sync.util';

const TYPE_THE_ANSWER_SLUG = 'type-the-answer';

interface INormalizedQuestion {
  order: number;

  question_text: string;

  correct_answer: string;
}

export interface ICreateTypeAnswerGameArgs {
  name: string;

  description: string;

  thumbnailImageFile: unknown;

  isPublished: boolean;

  timeLimitSeconds: number;

  scorePerQuestion: number;

  questions: INormalizedQuestion[];

  creatorId: string;
}

export interface IUpdateTypeAnswerGameStatusArgs {
  id: string;

  status: GameStatus | 'DRAFT' | 'PUBLISHED';

  userId: string;
}

export interface IUpdateTypeAnswerGameArgs {
  id: string;

  userId: string;

  userRole: string;

  name?: string;

  description?: string;

  thumbnailImageFile?: unknown;

  isPublished?: boolean;

  timeLimitSeconds?: number;

  scorePerQuestion?: number;

  questions?: INormalizedQuestion[];
}

export interface ICheckAnswerPayload {
  answers: {
    question_index: number;

    user_answer: string;
  }[];

  completion_time?: number;
}

export async function createTypeAnswerGame(args: ICreateTypeAnswerGameArgs) {
  const {
    name,

    description,

    thumbnailImageFile,

    isPublished,

    timeLimitSeconds,

    scorePerQuestion,

    questions,

    creatorId,
  } = args;

  // Upload thumbnail

  let thumbnailUrl = '';

  try {
    if (!thumbnailImageFile) {
      throw new ErrorResponse(400, 'Thumbnail image is required');
    }

    if (thumbnailImageFile instanceof File) {
      thumbnailUrl = await FileManager.upload(
        'type-the-answer',

        thumbnailImageFile,
      );
    } else {
      throw new ErrorResponse(400, 'Invalid thumbnail image format');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'File upload failed';

    throw new ErrorResponse(400, errorMessage);
  }

  const status: GameStatus = (
    isPublished ? 'PUBLISHED' : 'DRAFT'
  ) as GameStatus;

  const publishedAt = isPublished ? new Date() : null;

  try {
    const template = await prisma.gameTemplates.findUnique({
      where: { slug: TYPE_THE_ANSWER_SLUG },

      select: { id: true },
    });

    if (!template) {
      throw new ErrorResponse(404, 'Game template not found');
    }

    const typeAnswerGame = await prisma.$transaction(async tx => {
      const created = await tx.typeAnswerGame.create({
        data: {
          templateId: template.id,

          creatorId,

          title: name,

          description,

          thumbnailUrl: thumbnailUrl || undefined,

          timeLimitSec: timeLimitSeconds,

          pointsPerQuestion: scorePerQuestion,

          status,

          publishedAt: publishedAt || undefined,

          questions: {
            create: questions.map(question => ({
              order: question.order ?? 0,

              text: question.question_text,

              answer: question.correct_answer,
            })),
          },
        },

        include: {
          questions: true,
        },
      });

      // Sink ke tabel Games supaya muncul di explore & my-projects

      await tx.games.create({
        data: {
          id: created.id, // samakan id untuk konsistensi

          game_template_id: template.id,

          creator_id: creatorId,

          name,

          description,

          thumbnail_image: created.thumbnailUrl,

          is_published: isPublished,

          game_json: {
            type: TYPE_THE_ANSWER_SLUG,

            type_answer_game_id: created.id,

            time_limit_seconds: timeLimitSeconds,

            score_per_question: scorePerQuestion,
          } as unknown as Prisma.InputJsonValue,

          total_played: 0,
        },
      });

      return created;
    });

    // Sync to CSV after successful creation
    void syncTypeAnswerCSV().catch((error: unknown) =>
      console.error('CSV sync error:', error),
    );

    return typeAnswerGame;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create game';

    throw new ErrorResponse(400, errorMessage);
  }
}

export async function updateTypeAnswerGameStatus(
  args: IUpdateTypeAnswerGameStatusArgs,
) {
  const { id, status, userId } = args;

  try {
    const template = await prisma.gameTemplates.findUnique({
      where: { slug: TYPE_THE_ANSWER_SLUG },

      select: { id: true },
    });

    if (!template) {
      throw new ErrorResponse(404, 'Game template not found');
    }

    const updated = await prisma.typeAnswerGame.update({
      where: {
        id,

        creatorId: userId,
      },

      data: {
        status: status,

        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    // Jaga sinkron status di tabel Games (buat jika belum ada)

    await prisma.games.upsert({
      where: { id },

      update: { is_published: status === 'PUBLISHED' },

      create: {
        id,

        game_template_id: template.id,

        creator_id: userId,

        name: updated.title,

        description: updated.description,

        thumbnail_image: updated.thumbnailUrl,

        is_published: status === 'PUBLISHED',

        game_json: {
          type: TYPE_THE_ANSWER_SLUG,

          type_answer_game_id: id,
        } as unknown as Prisma.InputJsonValue,

        total_played: 0,
      },
    });

    // Sync to CSV after status update
    void syncTypeAnswerCSV().catch((error: unknown) =>
      console.error('CSV sync error:', error),
    );

    return updated;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update game status';

    throw new ErrorResponse(400, errorMessage);
  }
}

export async function getTypeAnswerGameDetail(
  id: string,

  userId: string,

  userRole: string,
) {
  const game = await prisma.typeAnswerGame.findUnique({
    where: { id },

    select: {
      id: true,

      title: true,

      description: true,

      thumbnailUrl: true,

      timeLimitSec: true,

      pointsPerQuestion: true,

      status: true,

      creatorId: true,

      template: { select: { slug: true } },

      questions: { select: { order: true, text: true, answer: true } },
    },
  });

  if (!game) throw new ErrorResponse(404, 'Game not found');

  // Jangan blokir jika slug tidak cocok, supaya data lama tetap bisa dimuat

  if (userRole !== 'SUPER_ADMIN' && game.creatorId !== userId)
    throw new ErrorResponse(403, 'User cannot access this game');

  return {
    id: game.id,

    name: game.title,

    description: game.description,

    thumbnail_image: game.thumbnailUrl,

    is_published: game.status === 'PUBLISHED',

    time_limit_seconds: game.timeLimitSec,

    score_per_question: game.pointsPerQuestion,

    questions: game.questions.map((q, index) => ({
      question_index: q.order ?? index,

      question_text: q.text,

      correct_answer: q.answer,
    })),
  };
}

export async function updateTypeAnswerGame(args: IUpdateTypeAnswerGameArgs) {
  const {
    id,

    userId,

    userRole,

    name,

    description,

    thumbnailImageFile,

    isPublished,

    timeLimitSeconds,

    scorePerQuestion,

    questions,
  } = args;

  const game = await prisma.typeAnswerGame.findUnique({
    where: { id },

    select: {
      id: true,

      title: true,

      description: true,

      thumbnailUrl: true,

      timeLimitSec: true,

      pointsPerQuestion: true,

      status: true,

      creatorId: true,

      template: { select: { slug: true, id: true } },
    },
  });

  if (!game || game.template.slug !== TYPE_THE_ANSWER_SLUG)
    throw new ErrorResponse(404, 'Game not found');

  if (userRole !== 'SUPER_ADMIN' && game.creatorId !== userId)
    throw new ErrorResponse(403, 'User cannot access this game');

  let thumbnailUrl = game.thumbnailUrl;

  try {
    if (thumbnailImageFile) {
      const fileInfo = thumbnailImageFile as unknown as {
        originalname?: string;
        name?: string;
        size?: number;
      };
      console.log('Thumbnail file received:', {
        name: fileInfo.originalname || fileInfo.name,
        size: fileInfo.size,
        type: typeof thumbnailImageFile,
      });

      thumbnailUrl = await FileManager.upload(
        'type-the-answer',

        thumbnailImageFile,
      );

      console.log('New thumbnail uploaded:', thumbnailUrl);
    } else {
      console.log('No new thumbnail file, keeping existing:', thumbnailUrl);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'File upload failed';

    console.error('Thumbnail upload error:', error);

    throw new ErrorResponse(400, errorMessage);
  }

  let status: GameStatus = game.status;

  if (typeof isPublished === 'boolean') {
    status = isPublished ? 'PUBLISHED' : 'DRAFT';
  }

  const publishedAt = status === 'PUBLISHED' ? new Date() : null;

  const updated = await prisma.$transaction(async tx => {
    // replace questions if provided

    if (questions) {
      await tx.typeAnswerQuestion.deleteMany({ where: { gameId: id } });
    }

    const updatedGame = await tx.typeAnswerGame.update({
      where: { id },

      data: {
        title: name ?? game.title,

        description: description ?? game.description,

        thumbnailUrl,

        timeLimitSec: timeLimitSeconds ?? game.timeLimitSec,

        pointsPerQuestion: scorePerQuestion ?? game.pointsPerQuestion,

        status,

        publishedAt: status === 'PUBLISHED' ? publishedAt : null,

        questions: questions
          ? {
              create: questions.map(q => ({
                order: q.order ?? 0,

                text: q.question_text,

                answer: q.correct_answer,
              })),
            }
          : undefined,
      },
    });

    await tx.games.upsert({
      where: { id },

      update: {
        name: updatedGame.title,

        description: updatedGame.description,

        thumbnail_image: updatedGame.thumbnailUrl,

        is_published: status === 'PUBLISHED',

        game_json: {
          type: TYPE_THE_ANSWER_SLUG,

          type_answer_game_id: id,

          time_limit_seconds: updatedGame.timeLimitSec,

          score_per_question: updatedGame.pointsPerQuestion,
        } as unknown as Prisma.InputJsonValue,
      },

      create: {
        id,

        game_template_id: game.template.id,

        creator_id: userId,

        name: updatedGame.title,

        description: updatedGame.description,

        thumbnail_image: updatedGame.thumbnailUrl,

        is_published: status === 'PUBLISHED',

        game_json: {
          type: TYPE_THE_ANSWER_SLUG,

          type_answer_game_id: id,

          time_limit_seconds: updatedGame.timeLimitSec,

          score_per_question: updatedGame.pointsPerQuestion,
        } as unknown as Prisma.InputJsonValue,

        total_played: 0,
      },
    });

    return updatedGame;
  });

  // Sync to CSV after successful update
  void syncTypeAnswerCSV().catch((error: unknown) =>
    console.error('CSV sync error:', error),
  );

  return updated;
}

export async function getTypeAnswerGamePlay(
  id: string,

  isPublic: boolean,

  userId?: string,

  userRole?: string,
) {
  const game = await prisma.typeAnswerGame.findUnique({
    where: { id },

    select: {
      id: true,

      title: true,

      description: true,

      thumbnailUrl: true,

      timeLimitSec: true,

      pointsPerQuestion: true,

      status: true,

      creatorId: true,

      template: { select: { slug: true } },

      questions: { select: { order: true, text: true, answer: true } },
    },
  });

  if (!game) throw new ErrorResponse(404, 'Game not found');

  // Jangan blokir jika slug tidak cocok, supaya data lama tetap bisa dimainkan

  if (isPublic && game.status !== 'PUBLISHED')
    throw new ErrorResponse(404, 'Game not found');

  // For private endpoint, allow access if user is SUPER_ADMIN or the creator
  if (!isPublic) {
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isCreator = userId && game.creatorId === userId;

    if (!isSuperAdmin && !isCreator) {
      throw new ErrorResponse(403, 'User cannot get this game data');
    }
  }

  return {
    id: game.id,

    name: game.title,

    description: game.description,

    thumbnail_image: game.thumbnailUrl,

    is_published: game.status === 'PUBLISHED',

    questions: (game.questions ?? []).map((q, index) => ({
      question_index: q.order ?? index,

      question_text: q.text,

      correct_answer: q.answer,
    })),

    time_limit_seconds: game.timeLimitSec,

    score_per_question: game.pointsPerQuestion,
  };
}

export async function checkTypeAnswer(
  id: string,

  userId: string,

  payload: ICheckAnswerPayload,
) {
  const game = await prisma.typeAnswerGame.findUnique({
    where: { id },

    select: {
      id: true,

      pointsPerQuestion: true,

      questions: {
        select: {
          order: true,

          answer: true,
        },
      },

      template: { select: { slug: true } },

      status: true,

      creatorId: true,
    },
  });

  if (!game) throw new ErrorResponse(404, 'Game not found');

  // Jangan blokir jika slug tidak cocok, supaya data lama tetap bisa dicek

  // Allow owner to submit even if game is not published (for testing)
  const isOwner = game.creatorId === userId;
  if (game.status !== 'PUBLISHED' && !isOwner)
    throw new ErrorResponse(403, 'Game is not published');

  const totalQuestions = game.questions.length;

  let correctCount = 0;

  for (const answer of payload.answers) {
    const question =
      game.questions.find(q => (q.order ?? 0) === answer.question_index) ||
      game.questions[answer.question_index];

    if (!question) continue;

    if (
      question.answer.trim().toLowerCase() ===
      answer.user_answer.trim().toLowerCase()
    ) {
      correctCount++;
    }
  }

  const score = correctCount * game.pointsPerQuestion;

  const maxScore = totalQuestions * game.pointsPerQuestion;

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  // Save the result to database
  await prisma.typeAnswerGameResult.create({
    data: {
      gameId: id,
      playerId: userId,
      score,
      correctAnswers: correctCount,
      totalQuestions,
      completionTime: payload.completion_time || 0,
      percentage: Math.round(percentage * 100) / 100,
    },
  });

  // Sync to CSV after saving result
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const syncPromise = syncTypeAnswerCSV();
  void syncPromise.catch((error: unknown) =>
    console.error('CSV sync error:', error),
  );

  return {
    correct_answers: correctCount,

    total_questions: totalQuestions,

    max_score: maxScore,

    score,

    percentage: Math.round(percentage * 100) / 100,
  };
}

export async function getTypeAnswerLeaderboard(gameId: string) {
  // Get all results for this game
  const allResults = await prisma.typeAnswerGameResult.findMany({
    where: { gameId },
    select: {
      score: true,
      completionTime: true,
      percentage: true,
      playerId: true,
      player: {
        select: {
          username: true,
        },
      },
    },
    orderBy: [{ score: 'desc' }, { completionTime: 'asc' }],
  });

  // Group by username and keep only the best result for each player
  const bestResultsByPlayer = new Map<string, (typeof allResults)[0]>();

  for (const result of allResults) {
    const existing = bestResultsByPlayer.get(result.playerId);

    if (existing) {
      // Keep result with higher score, or if same score, keep the one with faster time
      if (
        result.score > existing.score ||
        (result.score === existing.score &&
          result.completionTime < existing.completionTime)
      ) {
        bestResultsByPlayer.set(result.playerId, result);
      }
    } else {
      bestResultsByPlayer.set(result.playerId, result);
    }
  }

  // Convert to array and sort again
  const results = [...bestResultsByPlayer.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      return a.completionTime - b.completionTime;
    })
    .slice(0, 5); // Take top 5 only

  return results.map(result => ({
    player_name: result.player.username,
    score: result.score,
    completion_time: result.completionTime,
    percentage: result.percentage,
  }));
}

export async function deleteTypeAnswerGame(
  id: string,

  userId: string,

  userRole: string,
) {
  try {
    // Check if game exists and user has permission
    const game = await prisma.typeAnswerGame.findUnique({
      where: { id },

      select: {
        id: true,

        creatorId: true,

        thumbnailUrl: true,
      },
    });

    if (!game) {
      throw new ErrorResponse(404, 'Game not found');
    }

    // Only creator or admin can delete
    if (
      game.creatorId !== userId &&
      userRole !== 'ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      throw new ErrorResponse(
        403,
        'You do not have permission to delete this game',
      );
    }

    // Delete thumbnail file if exists
    if (game.thumbnailUrl) {
      try {
        await FileManager.remove(game.thumbnailUrl);
      } catch (error) {
        console.error('Failed to delete thumbnail:', error);
        // Continue even if file deletion fails
      }
    }

    // Delete from database (cascade will delete questions and results)
    await prisma.$transaction(async tx => {
      // Delete from Games table first
      await tx.games.deleteMany({
        where: { id },
      });

      // Delete from TypeAnswerGame (will cascade to questions and results)
      await tx.typeAnswerGame.delete({
        where: { id },
      });
    });

    // Sync to CSV after successful deletion
    void syncTypeAnswerCSV().catch((error: unknown) =>
      console.error('CSV sync error:', error),
    );

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete game';

    throw new ErrorResponse(400, errorMessage);
  }
}
