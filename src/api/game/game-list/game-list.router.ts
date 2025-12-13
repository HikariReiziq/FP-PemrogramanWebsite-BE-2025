/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';

import { AnagramController } from './anagram/anagram.controller';
import { MazeChaseController } from './maze-chase/maze-chase.controller';
import { PairOrNoPairController } from './pair-or-no-pair/pair-or-no-pair.controller';
import { QuizController } from './quiz/quiz.controller';
import { SpeedSortingController } from './speed-sorting/speed-sorting.controller';
import { TypeSpeedController } from './type-speed/type-speed.controller';
import TypeTheAnswerRouter from './type-the-answer/type-the-answer.route';

const GameListRouter = Router();

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
GameListRouter.use('/quiz', QuizController as any);
GameListRouter.use('/maze-chase', MazeChaseController);
GameListRouter.use('/speed-sorting', SpeedSortingController);
GameListRouter.use('/anagram', AnagramController);
GameListRouter.use('/pair-or-no-pair', PairOrNoPairController);
GameListRouter.use('/type-speed', TypeSpeedController);
GameListRouter.use('/type-the-answer', TypeTheAnswerRouter);

export default GameListRouter;
