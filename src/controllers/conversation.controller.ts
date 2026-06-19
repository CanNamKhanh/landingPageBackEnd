import { Response } from "express";
import { conversationService } from "../services/conversation.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  SendMessageInput,
  GetMessagesInput,
} from "../schemas/conversation.schema";
import { ConversationType } from "@prisma/client";

// ─── GET MY CONVERSATIONS (both AI + ADMIN) ───────────────────────────────────

export const getMyConversations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;

  const conversations =
    await conversationService.getMyConversationsService(userId);

  res.status(200).json({
    success: true,
    data: { conversations },
  });
};

// ─── GET AI MESSAGES ──────────────────────────────────────────────────────────

export const getAiMessages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const query = req.query as unknown as GetMessagesInput;

  const result = await conversationService.getMessagesService(
    userId,
    ConversationType.AI,
    query,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

// ─── SEND MESSAGE TO AI ───────────────────────────────────────────────────────

export const sendMessageToAi = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const body = req.body as SendMessageInput;

  const userMessage = await conversationService.sendMessageToAiService(
    userId,
    body,
  );

  // NOTE: plug your AI provider here (OpenAI, OpenRouter, etc.)
  // For now we return a placeholder reply so you can wire it up later.
  const aiReplyContent =
    "[AI reply placeholder — connect your AI provider here]";
  const aiMessage = await conversationService.saveAiReplyService(
    userMessage.conversationId,
    aiReplyContent,
  );

  res.status(201).json({
    success: true,
    data: {
      userMessage,
      aiMessage,
    },
  });
};

// ─── GET ADMIN MESSAGES ───────────────────────────────────────────────────────

export const getAdminMessages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const query = req.query as unknown as GetMessagesInput;

  const result = await conversationService.getMessagesService(
    userId,
    ConversationType.ADMIN,
    query,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

// ─── SEND MESSAGE TO ADMIN ────────────────────────────────────────────────────

export const sendMessageToAdmin = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const body = req.body as SendMessageInput;

  const message = await conversationService.sendMessageToAdminService(
    userId,
    body,
  );

  res.status(201).json({
    success: true,
    data: { message },
  });
};

// ─── ADMIN: GET ALL USER CONVERSATIONS ────────────────────────────────────────

export const adminGetAllConversations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const conversations =
    await conversationService.adminGetAllConversationsService();

  res.status(200).json({
    success: true,
    data: { conversations },
  });
};

// ─── ADMIN: GET A SPECIFIC USER'S MESSAGES ────────────────────────────────────

export const adminGetUserMessages = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { userId: targetUserId } = req.params as { userId: string };
  const query = req.query as unknown as GetMessagesInput;

  const result = await conversationService.adminGetUserMessagesService(
    targetUserId,
    query,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
};

// ─── ADMIN: REPLY TO USER ─────────────────────────────────────────────────────

export const adminReply = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const adminId = req.userId as string;
  const { userId: targetUserId } = req.params as { userId: string };
  const body = req.body as SendMessageInput;

  const message = await conversationService.adminReplyService(
    adminId,
    targetUserId,
    body,
  );

  res.status(201).json({
    success: true,
    data: { message },
  });
};
