// ─── Auth types ────────────────────────────────────────────────────────────────

import { ConversationType, MessageSenderType, Role } from "../generated/prisma";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: Date;
}

// ─── Conversation types ────────────────────────────────────────────────────────

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
  } | null;
}

export interface ConversationWithMessages {
  id: string;
  type: ConversationType;
  messages: MessageResponse[];
}

export interface PaginatedMessages {
  messages: MessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Admin types ────────────────────────────────────────────────────────────────
// NOTE: passwordHash is intentionally NEVER included in any admin response type.
// Returning password hashes (even hashed) is unnecessary and risky if logs/responses leak.

export interface AdminUserDetail {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  conversationCount: number;
  messageCount: number;
}

export interface AdminUserConversations {
  user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    createdAt: Date;
  };
  conversations: ConversationWithMessages[];
}
