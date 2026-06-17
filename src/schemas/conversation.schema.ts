import * as z from "zod";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(2000, "Message content is too long"),
});

export const getMessagesSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
