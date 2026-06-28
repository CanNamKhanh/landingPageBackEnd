import { z } from "zod";

export const sendMessageRequestSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const listMessagesQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
