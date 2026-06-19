"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersWithConversations = exports.getUserConversations = exports.getUserDetail = exports.getAllUsers = void 0;
const admin_service_1 = require("../services/admin.service");
// ─── GET ALL USERS (paginated, searchable) ────────────────────────────────────
const getAllUsers = async (req, res) => {
    const query = req.query;
    const result = await admin_service_1.adminService.getAllUsersService(query);
    res.status(200).json({
        success: true,
        data: result,
    });
};
exports.getAllUsers = getAllUsers;
// ─── GET ONE USER'S DETAIL ─────────────────────────────────────────────────────
const getUserDetail = async (req, res) => {
    const { userId } = req.params;
    const user = await admin_service_1.adminService.getUserDetailService(userId);
    res.status(200).json({
        success: true,
        data: { user },
    });
};
exports.getUserDetail = getUserDetail;
// ─── GET ONE USER'S CONVERSATIONS (AI + ADMIN) ────────────────────────────────
const getUserConversations = async (req, res) => {
    const { userId } = req.params;
    const result = await admin_service_1.adminService.getUserConversationsService(userId);
    res.status(200).json({
        success: true,
        data: result,
    });
};
exports.getUserConversations = getUserConversations;
// ─── GET ALL USERS WITH ALL THEIR CONVERSATIONS (full dump) ──────────────────
const getAllUsersWithConversations = async (req, res) => {
    const result = await admin_service_1.adminService.getAllUsersWithConversationsService();
    res.status(200).json({
        success: true,
        data: { users: result },
    });
};
exports.getAllUsersWithConversations = getAllUsersWithConversations;
//# sourceMappingURL=admin.controller.js.map