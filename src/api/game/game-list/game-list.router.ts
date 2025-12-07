/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { QuizController } from './quiz/quiz.controller';
import TypeTheAnswerRouter from './type-the-answer/type-the-answer.route';

const GameListRouter = Router();

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
GameListRouter.use('/quiz', QuizController as any);
GameListRouter.use('/type-the-answer', TypeTheAnswerRouter);

export default GameListRouter;
