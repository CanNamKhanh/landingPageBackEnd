// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface RegisterBody {
  email: string;
  username: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface ChangeUserInfoBody {
  username?: string;
  email?: string;
}

// JWT payload chỉ chứa userId — gọn, đúng convention của bạn
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenBody {
  refreshToken: string;
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Conversation Types ───────────────────────────────────────────────────────

export interface SendMessageBody {
  content?: string;
  imageUrl?: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  content: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  userId: string;
  type: ConversationType;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageResponse[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Request Extensions ───────────────────────────────────────────────────────

import { Request } from "express";
import { ConversationType, MessageSenderType, Role } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
