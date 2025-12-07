// src/api/game/game-list/type-the-answer/type-the-answer.controller.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextFunction, type Response } from 'express';

import { type AuthedRequest } from '@/common/interface';
import { normalizeError } from '@/common/utils/error.util';

import {
  type CreateTypeAnswerFormProps,
  type TypeAnswerQuestionProps,
  type TypeTheAnswerCheckProps,
  type UpdateTypeAnswerFormProps,
} from './type-the-answer.schema';
import * as typeTheAnswerService from './type-the-answer.service';

type CreateGameRequest = AuthedRequest<
  Record<string, never>,
  unknown,
  CreateTypeAnswerFormProps
>;

type UpdateStatusRequest = AuthedRequest<
  { id: string },
  unknown,
  { status: 'DRAFT' | 'PUBLISHED' }
>;

type UpdateGameRequest = AuthedRequest<
  { id: string },
  unknown,
  UpdateTypeAnswerFormProps
>;

type GetGameRequest = AuthedRequest<{ id: string }>;

function normalizeQuestions(questions: TypeAnswerQuestionProps[]): {
  order: number;
  question_index: number;
  question_text: string;
  correct_answer: string;
}[] {
  return questions.map((question, index) => {
    let orderValue = index;
    if (typeof question.order === 'number') orderValue = question.order;
    else if (typeof question.question_index === 'number')
      orderValue = question.question_index;

    const questionIndex =
      typeof question.question_index === 'number'
        ? question.question_index
        : index;

    return {
      order: orderValue,
      question_index: questionIndex,
      question_text: question.question_text ?? question.questionText ?? '',
      correct_answer: question.correct_answer ?? question.correctAnswer ?? '',
    };
  });
}

export async function createTypeAnswerGame(
  request: CreateGameRequest,

  response: Response,

  next: NextFunction,
): Promise<void> {
  try {
    const { user } = request;

    if (!user || !user.id) {
      response.status(401).json({
        success: false,

        message: 'Unauthorized',
      });

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

    const {
      name,

      description,

      thumbnail_image,

      background_image,

      is_published,

      time_limit_seconds,

      score_per_question,

      questions,
    } = request.body;

    const normalizedQuestions = normalizeQuestions(questions);

    const createdGame = await typeTheAnswerService.createTypeAnswerGame({
      name,

      description,

      thumbnailImageFile: thumbnail_image,

      backgroundImageFile: background_image,

      isPublished: is_published,

      timeLimitSeconds: time_limit_seconds,

      scorePerQuestion: score_per_question,

      questions: normalizedQuestions,

      creatorId: user.id,
    });

    response.status(201).json({
      success: true,

      data: createdGame,
    });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export async function getTypeAnswerGameDetail(
  request: GetGameRequest,

  response: Response,

  next: NextFunction,
): Promise<void> {
  try {
    const { user } = request;

    if (!user || !user.id) {
      response.status(401).json({
        success: false,

        message: 'Unauthorized',
      });

      return;
    }

    const data = await typeTheAnswerService.getTypeAnswerGameDetail(
      request.params.id,

      user.id,

      user.role,
    );

    response.status(200).json({
      success: true,

      data,
    });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export async function updateTypeAnswerGame(
  request: UpdateGameRequest,

  response: Response,

  next: NextFunction,
): Promise<void> {
  try {
    const { user } = request;

    if (!user || !user.id) {
      response.status(401).json({
        success: false,

        message: 'Unauthorized',
      });

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment

    const {
      name,

      description,

      thumbnail_image,

      background_image,

      is_published,

      time_limit_seconds,

      score_per_question,

      questions,
    } = request.body;

    const normalizedQuestions = normalizeQuestions(questions);

    const updatedGame = await typeTheAnswerService.updateTypeAnswerGame({
      id: request.params.id,

      userId: user.id,

      userRole: user.role,

      name,

      description,

      thumbnailImageFile: thumbnail_image,

      backgroundImageFile: background_image,

      isPublished: is_published,

      timeLimitSeconds: time_limit_seconds,

      scorePerQuestion: score_per_question,

      questions: normalizedQuestions,
    });

    response.status(200).json({
      success: true,

      data: { id: updatedGame.id },
    });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export async function updateTypeAnswerGameStatus(
  request: UpdateStatusRequest,

  response: Response,

  next: NextFunction,
): Promise<void> {
  try {
    const { user } = request;

    if (!user || !user.id) {
      response.status(401).json({
        success: false,

        message: 'Unauthorized',
      });

      return;
    }

    const { id } = request.params;

    const { status } = request.body;

    const updatedGame = await typeTheAnswerService.updateTypeAnswerGameStatus({
      id,

      status,

      userId: user.id,
    });

    response.status(200).json({
      success: true,

      data: updatedGame,
    });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export async function getTypeAnswerGamePlayPublic(
  request: AuthedRequest<{ id: string }>,

  response: Response,

  next: NextFunction,
) {
  try {
    const data = await typeTheAnswerService.getTypeAnswerGamePlay(
      request.params.id,

      true,
    );

    response.status(200).json({ success: true, data });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export async function getTypeAnswerGamePlayPrivate(
  request: AuthedRequest<{ id: string }>,

  response: Response,

  next: NextFunction,
) {
  try {
    const { user } = request;

    if (!user || !user.id) {
      response.status(401).json({
        success: false,

        message: 'Unauthorized',
      });

      return;
    }

    const data = await typeTheAnswerService.getTypeAnswerGamePlay(
      request.params.id,

      false,

      user.id,

      user.role,
    );

    response.status(200).json({ success: true, data });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export async function checkTypeAnswerGame(
  request: AuthedRequest<{ id: string }, {}, TypeTheAnswerCheckProps>,

  response: Response,

  next: NextFunction,
) {
  try {
    const result = await typeTheAnswerService.checkTypeAnswer(
      request.params.id,

      request.body,
    );

    response.status(200).json({ success: true, data: result });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}

export function getTypeAnswerLeaderboard(
  _: AuthedRequest<{ id: string }>,

  response: Response,

  next: NextFunction,
) {
  try {
    const leaderboard = typeTheAnswerService.getTypeAnswerLeaderboard();

    response.status(200).json({ success: true, data: leaderboard });
  } catch (error: unknown) {
    next(normalizeError(error));
  }
}
