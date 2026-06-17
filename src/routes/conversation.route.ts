import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  sendMessageSchema,
  getMessagesSchema,
} from "../schemas/conversation.schema";
import {
  getMyConversations,
  getAiMessages,
  sendMessageToAi,
  getAdminMessages,
  sendMessageToAdmin,
  adminGetAllConversations,
  adminGetUserMessages,
  adminReply,
} from "../controllers/conversation.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { requireAdmin } from "../middlewares/requireAdmin.middleware";

const router = Router();

// All conversation routes require authentication
router.use(authenticate);

// ─── User routes ──────────────────────────────────────────────────────────────
router.get("/", asyncHandler(getMyConversations));

// AI conversation
router.get(
  "/ai/messages",
  validate(getMessagesSchema),
  asyncHandler(getAiMessages),
);
router.post(
  "/ai/messages",
  validate(sendMessageSchema),
  asyncHandler(sendMessageToAi),
);

// Admin conversation
router.get(
  "/admin/messages",
  validate(getMessagesSchema),
  asyncHandler(getAdminMessages),
);
router.post(
  "/admin/messages",
  validate(sendMessageSchema),
  asyncHandler(sendMessageToAdmin),
);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.get(
  "/admin-panel",
  requireAdmin,
  asyncHandler(adminGetAllConversations),
);
router.get(
  "/admin-panel/:userId/messages",
  requireAdmin,
  validate(getMessagesSchema),
  asyncHandler(adminGetUserMessages),
);
router.post(
  "/admin-panel/:userId/reply",
  requireAdmin,
  validate(sendMessageSchema),
  asyncHandler(adminReply),
);

export default router;
