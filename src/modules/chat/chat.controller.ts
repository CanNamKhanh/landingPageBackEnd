import { Request, Response } from "express";
import {
  listMessagesQuerySchema,
  sendMessageRequestSchema,
} from "./chat.requests.schema";
import * as chatService from "./chat.service";

/** USER: lấy conversation ADMIN của chính mình (tự tạo nếu chưa có) */
export async function getMyConversationHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const conversation = await chatService.getOrCreateAdminConversation(
    req.user!.id,
  );
  res.status(200).json({ data: conversation });
}

/** ADMIN: list toàn bộ cuộc chat với user */
export async function listAdminConversationsHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  const conversations = await chatService.listAdminConversations();
  res.status(200).json({ data: conversations });
}

export async function listMessagesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const query = listMessagesQuerySchema.parse(req.query);
  const messages = await chatService.listMessages(
    req.params.conversationId as string,
    req.user!,
    query,
  );
  res.status(200).json({ data: messages });
}

export async function sendMessageHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const body = sendMessageRequestSchema.parse(req.body);
  const message = await chatService.sendMessage(
    req.params.conversationId as string,
    req.user!,
    body.content,
  );
  res.status(201).json({ data: message });
}
