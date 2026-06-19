"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const requireAdmin_middleware_1 = require("../middlewares/requireAdmin.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const admin_schema_1 = require("../schemas/admin.schema");
const admin_controller_1 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// All admin routes require authentication + ADMIN role
router.use(auth_middleware_1.authenticate, requireAdmin_middleware_1.requireAdmin);
// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", (0, validate_middleware_1.validate)(admin_schema_1.getAllUsersSchema), (0, asyncHandler_middleware_1.asyncHandler)(admin_controller_1.getAllUsers));
router.get("/users/:userId", (0, asyncHandler_middleware_1.asyncHandler)(admin_controller_1.getUserDetail));
// ─── Conversations ────────────────────────────────────────────────────────────
router.get("/users/:userId/conversations", (0, asyncHandler_middleware_1.asyncHandler)(admin_controller_1.getUserConversations));
router.get("/conversations", (0, asyncHandler_middleware_1.asyncHandler)(admin_controller_1.getAllUsersWithConversations));
exports.default = router;
//# sourceMappingURL=admin.route.js.map