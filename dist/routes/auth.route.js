"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_schema_1 = require("../schemas/auth.schema");
const auth_controller_1 = require("../controllers/auth.controller");
const asyncHandler_middleware_1 = require("../middlewares/asyncHandler.middleware");
const router = (0, express_1.Router)();
// ─── Public routes ────────────────────────────────────────────────────────────
router.post("/register", (0, validate_middleware_1.validate)(auth_schema_1.registerSchema), (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.register));
router.post("/login", (0, validate_middleware_1.validate)(auth_schema_1.loginSchema), (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.login));
router.post("/refresh-token", (0, validate_middleware_1.validate)(auth_schema_1.refreshTokenSchema), (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.refreshToken));
router.post("/forgot-password", (0, validate_middleware_1.validate)(auth_schema_1.forgotPasswordSchema), (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.forgotPassword));
// ─── Protected routes ─────────────────────────────────────────────────────────
router.use(auth_middleware_1.authenticate);
router.post("/logout", (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.logout));
router.get("/me", (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.getMe));
router.patch("/me", (0, validate_middleware_1.validate)(auth_schema_1.changeUserInfoSchema), (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.changeUserInfo));
router.patch("/change-password", (0, validate_middleware_1.validate)(auth_schema_1.changePasswordSchema), (0, asyncHandler_middleware_1.asyncHandler)(auth_controller_1.changePassword));
exports.default = router;
//# sourceMappingURL=auth.route.js.map