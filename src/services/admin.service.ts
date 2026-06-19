import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";
import { GetAllUsersInput } from "../schemas/admin.schema";
import {
  AdminUserDetail,
  AdminUserConversations,
  MessageResponse,
  ConversationWithMessages,
} from "../types/index.type";

// ─── messageSelect (same shape as conversation.service.ts) ──────────────────────

const messageSelectValidator = Prisma.validator<Prisma.MessageSelect>()({
  id: true,
  conversationId: true,
  senderType: true,
  content: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
    },
  },
});

type PrismaMessage = Prisma.MessageGetPayload<{
  select: typeof messageSelectValidator;
}>;

const mapMessage = (raw: PrismaMessage): MessageResponse => ({
  id: raw.id,
  conversationId: raw.conversationId,
  senderType: raw.senderType,
  content: raw.content ?? "",
  createdAt: raw.createdAt,
  user: raw.user,
});

// ─── Service ──────────────────────────────────────────────────────────────────
// NOTE: passwordHash is NEVER selected or returned anywhere in this service.

export const adminService = {
  // ─── GET ALL USERS (cursor pagination + optional search) ────────────────────

  async getAllUsersService(query: GetAllUsersInput): Promise<{
    users: AdminUserDetail[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const where: Prisma.UserWhereInput = query.search
      ? {
          OR: [
            { email: { contains: query.search } },
            { username: { contains: query.search } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1, // skip the cursor item itself
      }),
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });

    const hasMore = users.length > query.limit;
    const sliced = hasMore ? users.slice(0, query.limit) : users;
    const lastUser = sliced[sliced.length - 1] as
      | (typeof sliced)[0]
      | undefined;
    const nextCursor = hasMore && lastUser ? lastUser.id : null;

    const mappedUsers: AdminUserDetail[] = sliced.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      conversationCount: user._count.conversations,
      messageCount: user._count.messages,
    }));

    return {
      users: mappedUsers,
      nextCursor,
      hasMore,
    };
  },

  // ─── GET ONE USER'S FULL DETAIL ───────────────────────────────────────────────

  async getUserDetailService(targetUserId: string): Promise<AdminUserDetail> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            conversations: true,
            messages: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      conversationCount: user._count.conversations,
      messageCount: user._count.messages,
    };
  },

  // ─── GET ALL CONVERSATIONS (AI + ADMIN) OF ONE USER ──────────────────────────

  async getUserConversationsService(
    targetUserId: string,
  ): Promise<AdminUserConversations> {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: targetUserId },
      select: {
        id: true,
        type: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: messageSelectValidator,
        },
      },
    });

    const mappedConversations: ConversationWithMessages[] = conversations.map(
      (conv) => ({
        id: conv.id,
        type: conv.type,
        messages: conv.messages.map(mapMessage),
      }),
    );

    return {
      user,
      conversations: mappedConversations,
    };
  },

  // ─── GET ALL USERS WITH ALL THEIR CONVERSATIONS (full dump) ──────────────────

  async getAllUsersWithConversationsService(): Promise<
    AdminUserConversations[]
  > {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        conversations: {
          select: {
            id: true,
            type: true,
            messages: {
              orderBy: { createdAt: "asc" },
              select: messageSelectValidator,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => ({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
      conversations: user.conversations.map((conv) => ({
        id: conv.id,
        type: conv.type,
        messages: conv.messages.map(mapMessage),
      })),
    }));
  },
};
