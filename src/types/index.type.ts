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
