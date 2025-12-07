// src/api/game/game-list/type-the-answer/type-the-answer.service.ts
import { type GameStatus, type Prisma } from '@prisma/client'; // kalau ada enum GameStatus di Prisma

import { ErrorResponse, prisma } from '@/common';
import { FileManager } from '@/utils';

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

  backgroundImageFile?: unknown;

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

  backgroundImageFile?: unknown;

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
}

export async function createTypeAnswerGame(args: ICreateTypeAnswerGameArgs) {
  const {
    name,

    description,

    thumbnailImageFile,

    backgroundImageFile,

    isPublished,

    timeLimitSeconds,

    scorePerQuestion,

    questions,

    creatorId,
  } = args;

  // Upload files

  let thumbnailUrl = '';

  let backgroundUrl = '';

  try {
    if (thumbnailImageFile && thumbnailImageFile instanceof File) {
      thumbnailUrl = await FileManager.upload(
        'type-the-answer',

        thumbnailImageFile,
      );
    }

    if (backgroundImageFile && backgroundImageFile instanceof File) {
      backgroundUrl = await FileManager.upload(
        'type-the-answer',

        backgroundImageFile,
      );
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

          backgroundUrl: backgroundUrl || undefined,

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

      backgroundUrl: true,

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

    background_image: game.backgroundUrl,

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

    backgroundImageFile,

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

      backgroundUrl: true,

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

  let backgroundUrl = game.backgroundUrl ?? undefined;

  try {
    if (thumbnailImageFile && thumbnailImageFile instanceof File) {
      thumbnailUrl = await FileManager.upload(
        'type-the-answer',

        thumbnailImageFile,
      );
    }

    if (backgroundImageFile && backgroundImageFile instanceof File) {
      backgroundUrl = await FileManager.upload(
        'type-the-answer',

        backgroundImageFile,
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'File upload failed';

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

        backgroundUrl,

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

  if (!isPublic && userRole !== 'SUPER_ADMIN' && game.creatorId !== userId)
    throw new ErrorResponse(403, 'User cannot get this game data');

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
    },
  });

  if (!game) throw new ErrorResponse(404, 'Game not found');

  // Jangan blokir jika slug tidak cocok, supaya data lama tetap bisa dicek

  if (game.status !== 'PUBLISHED')
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

  return {
    correct_answers: correctCount,

    total_questions: totalQuestions,

    max_score: maxScore,

    score,

    percentage: Math.round(percentage * 100) / 100,
  };
}

export function getTypeAnswerLeaderboard() {
  // Placeholder leaderboard until there is a real implementation

  return [];
}
