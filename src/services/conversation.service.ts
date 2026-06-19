import { ConversationType, MessageSenderType, Prisma } from "@prisma/client";
import { prisma } from "../libs/prisma";
import {
  SendMessageInput,
  GetMessagesInput,
} from "../schemas/conversation.schema";
import {
  MessageResponse,
  PaginatedMessages,
  ConversationWithMessages,
} from "../types/index.type";

// ─── messageSelect ────────────────────────────────────────────────────────────
// Dùng Prisma.validator để TypeScript biết chính xác shape của result

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

// Type Prisma tự infer từ select — dùng để map sang MessageResponse
type PrismaMessage = Prisma.MessageGetPayload<{
  select: typeof messageSelectValidator;
}>;

type PrismaConversation = Prisma.ConversationGetPayload<{
  select: {
    id: true;
    type: true;
    messages: {
      select: typeof messageSelectValidator;
    };
  };
}>;

// ─── Mappers ──────────────────────────────────────────────────────────────────
// Chuyển Prisma type sang interface của bạn — không cần any, không cần cast bừa

const mapMessage = (raw: PrismaMessage): MessageResponse => ({
  id: raw.id,
  conversationId: raw.conversationId,
  senderType: raw.senderType,
  content: raw.content ?? "",
  createdAt: raw.createdAt,
  user: raw.user,
});

const mapConversation = (
  raw: PrismaConversation,
): ConversationWithMessages => ({
  id: raw.id,
  type: raw.type,
  messages: raw.messages.map(mapMessage),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrCreateConversation = async (
  userId: string,
  type: ConversationType,
): Promise<string> => {
  const conversation = await prisma.conversation.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type },
    update: {},
    select: { id: true },
  });

  return conversation.id;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const conversationService = {
  // ─── GET BOTH CONVERSATIONS (overview) ──────────────────────────────────────

  async getMyConversationsService(
    userId: string,
  ): Promise<ConversationWithMessages[]> {
    await Promise.all([
      getOrCreateConversation(userId, ConversationType.AI),
      getOrCreateConversation(userId, ConversationType.ADMIN),
    ]);

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: messageSelectValidator,
        },
      },
    });

    return conversations.map(mapConversation);
  },

  // ─── GET MESSAGES (cursor pagination) ────────────────────────────────────────

  async getMessagesService(
    userId: string,
    type: ConversationType,
    query: GetMessagesInput,
  ): Promise<PaginatedMessages> {
    const conversationId = await getOrCreateConversation(userId, type);

    // Resolve cursor date trước — không await bên trong object literal của Prisma
    let cursorDate: Date | undefined;
    if (query.cursor) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: query.cursor },
        select: { createdAt: true },
      });
      cursorDate = cursorMessage?.createdAt;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursorDate && { createdAt: { lt: cursorDate } }),
      },
      orderBy: { createdAt: "desc" },
      take: query.limit + 1,
      select: messageSelectValidator,
    });

    const hasMore = messages.length > query.limit;
    const sliced = hasMore ? messages.slice(0, query.limit) : messages;
    const lastMessage = sliced[sliced.length - 1] as
      | (typeof sliced)[0]
      | undefined;
    const nextCursor = hasMore && lastMessage ? lastMessage.id : null;

    return {
      messages: sliced.reverse().map(mapMessage),
      nextCursor,
      hasMore,
    };
  },

  // ─── SEND MESSAGE TO AI ───────────────────────────────────────────────────────

  async sendMessageToAiService(
    userId: string,
    data: SendMessageInput,
  ): Promise<MessageResponse> {
    const conversationId = await getOrCreateConversation(
      userId,
      ConversationType.AI,
    );

    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        userId,
        senderType: MessageSenderType.USER,
        content: data.content,
      },
      select: messageSelectValidator,
    });

    return mapMessage(userMessage);
  },

  // ─── SAVE AI REPLY ────────────────────────────────────────────────────────────

  async saveAiReplyService(
    conversationId: string,
    content: string,
  ): Promise<MessageResponse> {
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        userId: null,
        senderType: MessageSenderType.AI,
        content,
      },
      select: messageSelectValidator,
    });

    return mapMessage(aiMessage);
  },

  // ─── SEND MESSAGE TO ADMIN ────────────────────────────────────────────────────

  async sendMessageToAdminService(
    userId: string,
    data: SendMessageInput,
  ): Promise<MessageResponse> {
    const conversationId = await getOrCreateConversation(
      userId,
      ConversationType.ADMIN,
    );

    const message = await prisma.message.create({
      data: {
        conversationId,
        userId,
        senderType: MessageSenderType.USER,
        content: data.content,
      },
      select: messageSelectValidator,
    });

    return mapMessage(message);
  },

  // ─── ADMIN: REPLY TO USER ─────────────────────────────────────────────────────

  async adminReplyService(
    adminId: string,
    targetUserId: string,
    data: SendMessageInput,
  ): Promise<MessageResponse> {
    const conversationId = await getOrCreateConversation(
      targetUserId,
      ConversationType.ADMIN,
    );

    const message = await prisma.message.create({
      data: {
        conversationId,
        userId: adminId,
        senderType: MessageSenderType.ADMIN,
        content: data.content,
      },
      select: messageSelectValidator,
    });

    return mapMessage(message);
  },

  // ─── ADMIN: GET ALL ADMIN CONVERSATIONS ──────────────────────────────────────

  async adminGetAllConversationsService(): Promise<ConversationWithMessages[]> {
    const conversations = await prisma.conversation.findMany({
      where: { type: ConversationType.ADMIN },
      select: {
        id: true,
        type: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: messageSelectValidator,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map(mapConversation);
  },

  // ─── ADMIN: GET MESSAGES OF A SPECIFIC USER ───────────────────────────────────

  async adminGetUserMessagesService(
    targetUserId: string,
    query: GetMessagesInput,
  ): Promise<PaginatedMessages> {
    return conversationService.getMessagesService(
      targetUserId,
      ConversationType.ADMIN,
      query,
    );
  },
};
