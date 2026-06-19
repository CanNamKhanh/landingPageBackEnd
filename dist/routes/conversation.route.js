"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const conversation_schema_1 = require("../schemas/conversation.schema");
const conversation_controller_1 = require("../controllers/conversation.controller");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const requireAdmin_middleware_1 = require("../middlewares/requireAdmin.middleware");
const router = (0, express_1.Router)();
// All conversation routes require authentication
router.use(auth_middleware_1.authenticate);
// ─── User routes ──────────────────────────────────────────────────────────────
router.get("/", (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.getMyConversations));
// AI conversation
router.get("/ai/messages", (0, validate_middleware_1.validate)(conversation_schema_1.getMessagesSchema), (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.getAiMessages));
router.post("/ai/messages", (0, validate_middleware_1.validate)(conversation_schema_1.sendMessageSchema), (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.sendMessageToAi));
// Admin conversation
router.get("/admin/messages", (0, validate_middleware_1.validate)(conversation_schema_1.getMessagesSchema), (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.getAdminMessages));
router.post("/admin/messages", (0, validate_middleware_1.validate)(conversation_schema_1.sendMessageSchema), (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.sendMessageToAdmin));
// ─── Admin-only routes ────────────────────────────────────────────────────────
router.get("/admin-panel", requireAdmin_middleware_1.requireAdmin, (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.adminGetAllConversations));
router.get("/admin-panel/:userId/messages", requireAdmin_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(conversation_schema_1.getMessagesSchema), (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.adminGetUserMessages));
router.post("/admin-panel/:userId/reply", requireAdmin_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(conversation_schema_1.sendMessageSchema), (0, asyncHandler_middleware_1.asyncHandler)(conversation_controller_1.adminReply));
exports.default = router;
//# sourceMappingURL=conversation.route.js.map