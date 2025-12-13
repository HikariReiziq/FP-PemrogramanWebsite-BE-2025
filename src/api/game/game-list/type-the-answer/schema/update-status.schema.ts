import z from 'zod';

export const UpdateStatusSchema = z.object({
  status: z.enum(['PUBLISHED', 'DRAFT']),
});

export type IUpdateStatus = z.infer<typeof UpdateStatusSchema>;
