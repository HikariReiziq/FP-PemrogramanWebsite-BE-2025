// src/api/game/game-list/type-the-answer/type-the-answer.route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-default-export */
import { type NextFunction, type Response, Router } from 'express';

import { type AuthedRequest } from '@/common/interface';
import { validateAuth } from '@/common/middleware/auth.middleware';
import { validateBody } from '@/common/middleware/validator.middleware';

import {
  checkTypeAnswerGame,
  createTypeAnswerGame,
  deleteTypeAnswerGame,
  getTypeAnswerGameDetail,
  getTypeAnswerGamePlayPrivate,
  getTypeAnswerGamePlayPublic,
  getTypeAnswerLeaderboard,
  updateTypeAnswerGame,
  updateTypeAnswerGameStatus,
} from './type-the-answer.controller';
import {
  type CreateTypeAnswerFormProps,
  createTypeAnswerFormSchema,
  typeTheAnswerCheckSchema,
  type UpdateTypeAnswerFormProps,
  updateTypeAnswerFormSchema,
} from './type-the-answer.schema';

const typeTheAnswerRouter = Router();

type CreateGameRequestProps = AuthedRequest<
  Record<string, never>,
  unknown,
  CreateTypeAnswerFormProps
>;

type UpdateStatusRequestProps = AuthedRequest<
  { id: string },
  unknown,
  { status: 'DRAFT' | 'PUBLISHED' }
>;

type UpdateGameRequestProps = AuthedRequest<
  { id: string },
  unknown,
  UpdateTypeAnswerFormProps
>;

typeTheAnswerRouter.post(
  '/',

  validateAuth({}),

  validateBody({
    schema: createTypeAnswerFormSchema,

    file_fields: [
      { name: 'thumbnail_image', maxCount: 1 },

      { name: 'background_image', maxCount: 1 },
    ],
  }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: CreateGameRequestProps, response: Response, next: NextFunction) =>
    createTypeAnswerGame(request, response, next) as unknown as any,
);

typeTheAnswerRouter.get(
  '/:id',

  validateAuth({}),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateStatusRequestProps, response: Response, next: NextFunction) =>
    getTypeAnswerGameDetail(request, response, next) as unknown as any,
);

typeTheAnswerRouter.put(
  '/:id',

  validateAuth({}),

  validateBody({
    schema: updateTypeAnswerFormSchema,

    file_fields: [
      { name: 'thumbnail_image', maxCount: 1 },

      { name: 'background_image', maxCount: 1 },
    ],
  }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateGameRequestProps, response: Response, next: NextFunction) =>
    updateTypeAnswerGame(request, response, next) as unknown as any,
);

typeTheAnswerRouter.patch(
  '/:id/status',

  validateAuth({}),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateStatusRequestProps, response: Response, next: NextFunction) =>
    updateTypeAnswerGameStatus(request, response, next) as unknown as any,
);

typeTheAnswerRouter.get(
  '/:id/play/public',

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateStatusRequestProps, response: Response, next: NextFunction) =>
    getTypeAnswerGamePlayPublic(request, response, next) as unknown as any,
);

typeTheAnswerRouter.get(
  '/:id/play/private',

  validateAuth({}),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateStatusRequestProps, response: Response, next: NextFunction) =>
    getTypeAnswerGamePlayPrivate(request, response, next) as unknown as any,
);

typeTheAnswerRouter.post(
  '/:id/check',

  validateAuth({}),

  validateBody({ schema: typeTheAnswerCheckSchema }),

  (
    request: AuthedRequest<
      { id: string },
      Record<string, never>,
      {
        answers: { question_index: number; user_answer: string }[];
        completion_time: number;
      }
    >,
    response: Response,
    next: NextFunction,
  ) => checkTypeAnswerGame(request, response, next) as unknown as any,
);

typeTheAnswerRouter.get(
  '/:id/leaderboard',

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateStatusRequestProps, response: Response, next: NextFunction) =>
    getTypeAnswerLeaderboard(request, response, next) as unknown as any,
);

typeTheAnswerRouter.delete(
  '/:id',

  validateAuth({}),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  (request: UpdateStatusRequestProps, response: Response, next: NextFunction) =>
    deleteTypeAnswerGame(request, response, next) as unknown as any,
);

export default typeTheAnswerRouter;
