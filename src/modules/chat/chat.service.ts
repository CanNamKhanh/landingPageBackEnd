import { ConversationType, MessageSenderType, Role } from "@prisma/client";
import { logger } from "../../utils/logger";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { ListMessagesQuery } from "./chat.requests.schema";
import { prisma } from "../../libs/prisma";

const log = logger.scope("ChatService");

/** Map role hệ thống (User/Admin) -> senderType của Message. Booster không bao giờ tới được đây (chặn ở route). */
function roleToSenderType(role: Role): MessageSenderType {
  return role === Role.ADMIN ? MessageSenderType.ADMIN : MessageSenderType.USER;
}

/** User lấy (hoặc tự tạo nếu chưa có) conversation ADMIN của chính mình */
export async function getOrCreateAdminConversation(userId: string) {
  log.debug("getOrCreateAdminConversation", { userId });

  const existing = await prisma.conversation.findUnique({
    where: { userId_type: { userId, type: ConversationType.ADMIN } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { userId, type: ConversationType.ADMIN },
  });
}

/** Admin xem toàn bộ conversation type ADMIN (mọi cuộc chat với user) */
export async function listAdminConversations() {
  const conversations = await prisma.conversation.findMany({
    where: { type: ConversationType.ADMIN },
    include: {
      user: { select: { id: true, username: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }, // preview tin nhắn cuối
    },
    orderBy: { updatedAt: "desc" },
  });

  log.debug("listAdminConversations", { count: conversations.length });
  return conversations;
}

async function assertCanAccessConversation(
  conversationId: string,
  actor: { id: string; role: Role },
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new NotFoundError("Conversation không tồn tại");
  if (conversation.type !== ConversationType.ADMIN) {
    throw new ForbiddenError(
      "Conversation này không phải kênh chat Admin-User",
    );
  }

  const isOwner = conversation.userId === actor.id;
  const isAdmin = actor.role === Role.ADMIN;

  // Booster (hoặc user khác) không được vào - chỉ chính chủ user và admin
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Bạn không có quyền truy cập cuộc chat này");
  }

  return conversation;
}

export async function listMessages(
  conversationId: string,
  actor: { id: string; role: Role },
  query: ListMessagesQuery,
) {
  await assertCanAccessConversation(conversationId, actor);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    take: query.limit,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, username: true, role: true } } },
  });

  return messages;
}

export async function sendMessage(
  conversationId: string,
  actor: { id: string; role: Role },
  content: string,
) {
  await assertCanAccessConversation(conversationId, actor);

  const senderType = roleToSenderType(actor.role);
  log.info("sendMessage", { conversationId, userId: actor.id, senderType });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        userId: actor.id,
        senderType,
        content,
      },
    });
    // bump updatedAt để conversation list ở admin sort theo hoạt động mới nhất
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });

  return message;
}
