// src/common/interface/games/type-answer-game.interface.ts

export type ITypeAnswerStatus = 'DRAFT' | 'PUBLISHED';

export interface ITypeAnswerQuestion {
  id: string;
  order: number;
  question_index: number;
  question_text: string;
  correct_answer: string;
}

export interface ITypeAnswerGame {
  id: string;
  name: string;
  description: string;
  status: ITypeAnswerStatus;
  time_limit_seconds: number;
  score_per_question: number;
  thumbnail_image_url: string;
  background_image_url?: string;
  questions: ITypeAnswerQuestion[];
}
