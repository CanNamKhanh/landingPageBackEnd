import * as z from "zod";

export const getAllUsersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type GetAllUsersInput = z.infer<typeof getAllUsersSchema>;
