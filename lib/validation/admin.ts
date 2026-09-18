import { z } from 'zod';

export const inventorySchema = z.object({
  productId: z.string().min(1),
  username: z.string().min(1).max(200),
  password: z.string().max(500).optional(),
  credential: z.string().max(2000).optional(),
  note: z.string().max(2000).optional(),
});

export const userStatusSchema = z.object({
  status: z.enum(['active', 'blocked']),
});
