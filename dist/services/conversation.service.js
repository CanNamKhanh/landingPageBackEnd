"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = void 0;
const prisma_1 = require("@prisma/client");
const prisma_2 = require("../libs/prisma");
// ─── messageSelect ────────────────────────────────────────────────────────────
// Dùng Prisma.validator để TypeScript biết chính xác shape của result
const messageSelectValidator = prisma_1.Prisma.validator()({
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
// ─── Mappers ──────────────────────────────────────────────────────────────────
// Chuyển Prisma type sang interface của bạn — không cần any, không cần cast bừa
const mapMessage = (raw) => ({
  id: raw.id,
  conversationId: raw.conversationId,
  senderType: raw.senderType,
  content: raw.content ?? "",
  createdAt: raw.createdAt,
  user: raw.user,
});
const mapConversation = (raw) => ({
  id: raw.id,
  type: raw.type,
  messages: raw.messages.map(mapMessage),
});
// ─── Helpers ──────────────────────────────────────────────────────────────────
const getOrCreateConversation = async (userId, type) => {
  const conversation = await prisma_2.prisma.conversation.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type },
    update: {},
    select: { id: true },
  });
  return conversation.id;
};
// ─── Service ──────────────────────────────────────────────────────────────────
exports.conversationService = {
  // ─── GET BOTH CONVERSATIONS (overview) ──────────────────────────────────────
  async getMyConversationsService(userId) {
    await Promise.all([
      getOrCreateConversation(userId, prisma_1.ConversationType.AI),
      getOrCreateConversation(userId, prisma_1.ConversationType.ADMIN),
    ]);
    const conversations = await prisma_2.prisma.conversation.findMany({
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
  async getMessagesService(userId, type, query) {
    const conversationId = await getOrCreateConversation(userId, type);
    // Resolve cursor date trước — không await bên trong object literal của Prisma
    let cursorDate;
    if (query.cursor) {
      const cursorMessage = await prisma_2.prisma.message.findUnique({
        where: { id: query.cursor },
        select: { createdAt: true },
      });
      cursorDate = cursorMessage?.createdAt;
    }
    const messages = await prisma_2.prisma.message.findMany({
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
    const lastMessage = sliced[sliced.length - 1];
    const nextCursor = hasMore && lastMessage ? lastMessage.id : null;
    return {
      messages: sliced.reverse().map(mapMessage),
      nextCursor,
      hasMore,
    };
  },
  // ─── SEND MESSAGE TO AI ───────────────────────────────────────────────────────
  async sendMessageToAiService(userId, data) {
    const conversationId = await getOrCreateConversation(
      userId,
      prisma_1.ConversationType.AI,
    );
    const userMessage = await prisma_2.prisma.message.create({
      data: {
        conversationId,
        userId,
        senderType: prisma_1.MessageSenderType.USER,
        content: data.content,
      },
      select: messageSelectValidator,
    });
    return mapMessage(userMessage);
  },
  // ─── SAVE AI REPLY ────────────────────────────────────────────────────────────
  async saveAiReplyService(conversationId, content) {
    const aiMessage = await prisma_2.prisma.message.create({
      data: {
        conversationId,
        userId: null,
        senderType: prisma_1.MessageSenderType.AI,
        content,
      },
      select: messageSelectValidator,
    });
    return mapMessage(aiMessage);
  },
  // ─── SEND MESSAGE TO ADMIN ────────────────────────────────────────────────────
  async sendMessageToAdminService(userId, data) {
    const conversationId = await getOrCreateConversation(
      userId,
      prisma_1.ConversationType.ADMIN,
    );
    const message = await prisma_2.prisma.message.create({
      data: {
        conversationId,
        userId,
        senderType: prisma_1.MessageSenderType.USER,
        content: data.content,
      },
      select: messageSelectValidator,
    });
    return mapMessage(message);
  },
  // ─── ADMIN: REPLY TO USER ─────────────────────────────────────────────────────
  async adminReplyService(adminId, targetUserId, data) {
    const conversationId = await getOrCreateConversation(
      targetUserId,
      prisma_1.ConversationType.ADMIN,
    );
    const message = await prisma_2.prisma.message.create({
      data: {
        conversationId,
        userId: adminId,
        senderType: prisma_1.MessageSenderType.ADMIN,
        content: data.content,
      },
      select: messageSelectValidator,
    });
    return mapMessage(message);
  },
  // ─── ADMIN: GET ALL ADMIN CONVERSATIONS ──────────────────────────────────────
  async adminGetAllConversationsService() {
    const conversations = await prisma_2.prisma.conversation.findMany({
      where: { type: prisma_1.ConversationType.ADMIN },
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
  async adminGetUserMessagesService(targetUserId, query) {
    return exports.conversationService.getMessagesService(
      targetUserId,
      prisma_1.ConversationType.ADMIN,
      query,
    );
  },
};
//# sourceMappingURL=conversation.service.js.map
