import { z } from "zod";

export const createBoosterRequestSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(3).max(30),
  password: z.string().min(8).max(100),
  displayName: z.string().trim().min(1).max(100).optional(),
});
export type CreateBoosterRequest = z.infer<typeof createBoosterRequestSchema>;

export const updateBoosterRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBoosterRequest = z.infer<typeof updateBoosterRequestSchema>;

export const listBoostersQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
});
export type ListBoostersQuery = z.infer<typeof listBoostersQuerySchema>;
