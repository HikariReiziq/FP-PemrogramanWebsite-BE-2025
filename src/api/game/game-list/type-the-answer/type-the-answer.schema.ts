// src/api/game/game-list/type-the-answer/type-the-answer.schema.ts

import { z } from 'zod';

export const typeAnswerQuestionSchema = z.object({
  // Terima string/number dari form-data lalu konversi ke number (boleh kosong -> undefined)

  order: z

    .union([z.string(), z.number()])

    .optional()

    .transform(value =>
      value === undefined || value === '' ? undefined : Number(value),
    )

    .refine(
      value => value === undefined || (Number.isInteger(value) && value >= 0),

      'order must be a non-negative integer',
    ),

  question_index: z

    .union([z.string(), z.number()])

    .transform(Number)

    .pipe(z.number().int().nonnegative()),

  // front-end bisa kirim snake_case atau camelCase

  question_text: z.string().min(1).optional(),

  correct_answer: z.string().min(1).optional(),

  questionText: z.string().min(1).optional(),

  correctAnswer: z.string().min(1).optional(),
});

export type TypeAnswerQuestionProps = z.infer<typeof typeAnswerQuestionSchema>;

export const typeAnswerGameSchema = z.object({
  name: z.string().min(1),

  description: z.string().min(1),

  // biasanya File (multer / form-data), tapi di sini cukup any saja

  thumbnail_image: z.any(),

  background_image: z.any().optional(),

  is_published: z.boolean().default(false),

  time_limit_seconds: z.number().int().positive(),

  score_per_question: z.number().int().positive(),

  questions: z.array(typeAnswerQuestionSchema).min(1),
});

export type TypeAnswerGameProps = z.infer<typeof typeAnswerGameSchema>;

export const createTypeAnswerFormSchema = z.object({
  name: z.string().min(1),

  description: z.string().min(1),

  thumbnail_image: z.any(),

  background_image: z.any().optional(),

  // biasanya datang sebagai string ("true"/"false") dari form

  is_published: z

    .union([z.string(), z.boolean()])

    .transform(value => (typeof value === 'string' ? value === 'true' : value))

    .default(false),

  time_limit_seconds: z.union([z.string(), z.number()]).transform(Number),

  score_per_question: z.union([z.string(), z.number()]).transform(Number),

  questions: z
    .union([z.string(), z.array(typeAnswerQuestionSchema)])
    .transform(value => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          throw new Error('Invalid JSON format for questions');
        }
      }

      return value;
    })
    .pipe(z.array(typeAnswerQuestionSchema).min(1)),
});

export type CreateTypeAnswerFormProps = z.infer<
  typeof createTypeAnswerFormSchema
>;

export const updateTypeAnswerFormSchema = createTypeAnswerFormSchema.extend({
  thumbnail_image: z.any().optional(),
});

export type UpdateTypeAnswerFormProps = z.infer<
  typeof updateTypeAnswerFormSchema
>;

export const typeTheAnswerCheckSchema = z.object({
  answers: z.array(
    z.object({
      question_index: z.union([z.string(), z.number()]).transform(Number),

      user_answer: z.string().min(1),
    }),
  ),

  completion_time: z.number().int().nonnegative().optional().default(0),
});

export type TypeTheAnswerCheckProps = z.infer<typeof typeTheAnswerCheckSchema>;
