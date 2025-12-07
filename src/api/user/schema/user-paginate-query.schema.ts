import z from 'zod';

import { OrderBySchema, PaginationSchema } from '@/common';

const ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN'] as const;

export const UserPaginationQuerySchema = z.object({
  page: PaginationSchema.pageSchema,
  perPage: PaginationSchema.perPageSchema,
  role: z.optional(z.enum(ROLES)),
  search: z.optional(z.string().max(256)),
  orderByName: OrderBySchema,
  orderById: OrderBySchema,
  orderByCreatedAt: OrderBySchema,
});

export type IUserPaginationQuery = z.infer<typeof UserPaginationQuerySchema>;
