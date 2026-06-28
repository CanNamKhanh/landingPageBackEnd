import { Router } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./chat.controller";
import { authenticate, requireRole } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, requireRole(Role.USER, Role.ADMIN));

router.get(
  "/chat/my-conversation",
  requireRole(Role.USER),
  asyncHandler("getMyConversation", controller.getMyConversationHandler),
);

router.get(
  "/chat/conversations",
  requireRole(Role.ADMIN),
  asyncHandler(
    "listAdminConversations",
    controller.listAdminConversationsHandler,
  ),
);

router.get(
  "/chat/conversations/:conversationId/messages",
  asyncHandler("listMessages", controller.listMessagesHandler),
);

router.post(
  "/chat/conversations/:conversationId/messages",
  asyncHandler("sendMessage", controller.sendMessageHandler),
);

export default router;
