"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReply = exports.adminGetUserMessages = exports.adminGetAllConversations = exports.sendMessageToAdmin = exports.getAdminMessages = exports.sendMessageToAi = exports.getAiMessages = exports.getMyConversations = void 0;
const conversation_service_1 = require("../services/conversation.service");
const prisma_1 = require("../generated/prisma");
// ─── GET MY CONVERSATIONS (both AI + ADMIN) ───────────────────────────────────
const getMyConversations = async (req, res) => {
    const userId = req.userId;
    const conversations = await conversation_service_1.conversationService.getMyConversationsService(userId);
    res.status(200).json({
        success: true,
        data: { conversations },
    });
};
exports.getMyConversations = getMyConversations;
// ─── GET AI MESSAGES ──────────────────────────────────────────────────────────
const getAiMessages = async (req, res) => {
    const userId = req.userId;
    const query = req.query;
    const result = await conversation_service_1.conversationService.getMessagesService(userId, prisma_1.ConversationType.AI, query);
    res.status(200).json({
        success: true,
        data: result,
    });
};
exports.getAiMessages = getAiMessages;
// ─── SEND MESSAGE TO AI ───────────────────────────────────────────────────────
const sendMessageToAi = async (req, res) => {
    const userId = req.userId;
    const body = req.body;
    const userMessage = await conversation_service_1.conversationService.sendMessageToAiService(userId, body);
    // NOTE: plug your AI provider here (OpenAI, OpenRouter, etc.)
    // For now we return a placeholder reply so you can wire it up later.
    const aiReplyContent = "[AI reply placeholder — connect your AI provider here]";
    const aiMessage = await conversation_service_1.conversationService.saveAiReplyService(userMessage.conversationId, aiReplyContent);
    res.status(201).json({
        success: true,
        data: {
            userMessage,
            aiMessage,
        },
    });
};
exports.sendMessageToAi = sendMessageToAi;
// ─── GET ADMIN MESSAGES ───────────────────────────────────────────────────────
const getAdminMessages = async (req, res) => {
    const userId = req.userId;
    const query = req.query;
    const result = await conversation_service_1.conversationService.getMessagesService(userId, prisma_1.ConversationType.ADMIN, query);
    res.status(200).json({
        success: true,
        data: result,
    });
};
exports.getAdminMessages = getAdminMessages;
// ─── SEND MESSAGE TO ADMIN ────────────────────────────────────────────────────
const sendMessageToAdmin = async (req, res) => {
    const userId = req.userId;
    const body = req.body;
    const message = await conversation_service_1.conversationService.sendMessageToAdminService(userId, body);
    res.status(201).json({
        success: true,
        data: { message },
    });
};
exports.sendMessageToAdmin = sendMessageToAdmin;
// ─── ADMIN: GET ALL USER CONVERSATIONS ────────────────────────────────────────
const adminGetAllConversations = async (req, res) => {
    const conversations = await conversation_service_1.conversationService.adminGetAllConversationsService();
    res.status(200).json({
        success: true,
        data: { conversations },
    });
};
exports.adminGetAllConversations = adminGetAllConversations;
// ─── ADMIN: GET A SPECIFIC USER'S MESSAGES ────────────────────────────────────
const adminGetUserMessages = async (req, res) => {
    const { userId: targetUserId } = req.params;
    const query = req.query;
    const result = await conversation_service_1.conversationService.adminGetUserMessagesService(targetUserId, query);
    res.status(200).json({
        success: true,
        data: result,
    });
};
exports.adminGetUserMessages = adminGetUserMessages;
// ─── ADMIN: REPLY TO USER ─────────────────────────────────────────────────────
const adminReply = async (req, res) => {
    const adminId = req.userId;
    const { userId: targetUserId } = req.params;
    const body = req.body;
    const message = await conversation_service_1.conversationService.adminReplyService(adminId, targetUserId, body);
    res.status(201).json({
        success: true,
        data: { message },
    });
};
exports.adminReply = adminReply;
//# sourceMappingURL=conversation.controller.js.map