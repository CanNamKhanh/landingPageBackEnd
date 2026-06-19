"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserInfo = exports.getMe = exports.changePassword = exports.forgotPassword = exports.refreshToken = exports.logout = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
// ─── REGISTER ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const body = req.body;
    const user = await auth_service_1.authService.registerService(body);
    res.status(201).json({
        success: true,
        message: "Registration successful",
        data: { user },
    });
};
exports.register = register;
// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const body = req.body;
    const tokens = await auth_service_1.authService.loginService(body);
    res.status(200).json({
        success: true,
        message: "Login successful",
        data: tokens,
    });
};
exports.login = login;
// ─── LOGOUT ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
    const userId = req.userId;
    const accessToken = req.token;
    const { refreshToken } = req.body;
    await auth_service_1.authService.logoutService(userId, accessToken, refreshToken);
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};
exports.logout = logout;
// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
    const body = req.body;
    const tokens = await auth_service_1.authService.refreshTokenService(body);
    res.status(200).json({
        success: true,
        message: "Token refreshed",
        data: tokens,
    });
};
exports.refreshToken = refreshToken;
// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    const body = req.body;
    await auth_service_1.authService.forgotPasswordService(body);
    res.status(200).json({
        success: true,
        message: "Password reset successfully",
    });
};
exports.forgotPassword = forgotPassword;
// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
    const userId = req.userId;
    const body = req.body;
    await auth_service_1.authService.changePasswordService(userId, body);
    res.status(200).json({
        success: true,
        message: "Password changed successfully",
    });
};
exports.changePassword = changePassword;
// ─── GET ME ───────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    const userId = req.userId;
    const user = await auth_service_1.authService.getMeService(userId);
    res.status(200).json({
        success: true,
        data: { user },
    });
};
exports.getMe = getMe;
// ─── CHANGE USER INFO ──────────────────────────────────────────────────────────
const changeUserInfo = async (req, res) => {
    const userId = req.userId;
    const body = req.body;
    const user = await auth_service_1.authService.changeUserInfoService(userId, body);
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
    });
};
exports.changeUserInfo = changeUserInfo;
//# sourceMappingURL=auth.controller.js.map