"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../libs/prisma");
const redis_1 = require("../libs/redis");
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRED = process.env.JWT_EXPIRED || "1h";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRED = process.env.JWT_REFRESH_EXPIRED || "7d";
// Redis TTL in seconds (must match token expiry)
const ACCESS_TOKEN_TTL = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days
const generateAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, {
        expiresIn: JWT_EXPIRED,
    });
};
const generateRefreshToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRED,
    });
};
exports.authService = {
    // ─── REGISTER ────────────────────────────────────────────────────────────────
    async registerService(data) {
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ email: data.email }, { username: data.username }],
            },
        });
        if (existingUser) {
            if (existingUser.email === data.email) {
                throw new Error("EMAIL_TAKEN");
            }
            throw new Error("USERNAME_TAKEN");
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
            },
        });
        return user;
    },
    // ─── LOGIN ────────────────────────────────────────────────────────────────────
    async loginService(data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const isPasswordValid = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error("INVALID_CREDENTIALS");
        }
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        // Store refresh token in Redis
        await redis_1.redisClient.set(`refresh_token:${user.id}:${refreshToken}`, "valid", {
            EX: REFRESH_TOKEN_TTL,
        });
        return { accessToken, refreshToken };
    },
    // ─── LOGOUT ───────────────────────────────────────────────────────────────────
    async logoutService(userId, accessToken, refreshToken) {
        // Blacklist the access token
        await redis_1.redisClient.set(`blacklist:${accessToken}`, "revoked", {
            EX: ACCESS_TOKEN_TTL,
        });
        // Remove the refresh token
        await redis_1.redisClient.del(`refresh_token:${userId}:${refreshToken}`);
    },
    // ─── REFRESH TOKEN ─────────────────────────────────────────────────────────────
    async refreshTokenService(data) {
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(data.refreshToken, JWT_REFRESH_SECRET);
        }
        catch {
            throw new Error("INVALID_REFRESH_TOKEN");
        }
        const storedToken = await redis_1.redisClient.get(`refresh_token:${decoded.userId}:${data.refreshToken}`);
        if (!storedToken) {
            throw new Error("REFRESH_TOKEN_REVOKED");
        }
        // Rotate: delete old, issue new pair
        await redis_1.redisClient.del(`refresh_token:${decoded.userId}:${data.refreshToken}`);
        const newAccessToken = generateAccessToken(decoded.userId);
        const newRefreshToken = generateRefreshToken(decoded.userId);
        await redis_1.redisClient.set(`refresh_token:${decoded.userId}:${newRefreshToken}`, "valid", { EX: REFRESH_TOKEN_TTL });
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    },
    // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
    async forgotPasswordService(data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const newPasswordHash = await bcrypt_1.default.hash(data.newPassword, SALT_ROUNDS);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash },
        });
        // Invalidate all refresh tokens for this user after password change
        // (pattern delete — only works if Redis supports SCAN or you track tokens)
        // Simple approach: we can't wildcard-delete without SCAN, so we just trust
        // that existing tokens expire naturally. For stricter security, use a versioned key.
    },
    // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
    async changePasswordService(userId, data) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const isCurrentPasswordValid = await bcrypt_1.default.compare(data.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new Error("WRONG_CURRENT_PASSWORD");
        }
        const newPasswordHash = await bcrypt_1.default.hash(data.newPassword, SALT_ROUNDS);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash },
        });
    },
    // ─── GET ME ────────────────────────────────────────────────────────────────────
    async getMeService(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        return user;
    },
    // ─── CHANGE USER INFO ──────────────────────────────────────────────────────────
    async changeUserInfoService(userId, data) {
        if (data.username) {
            const takenByOther = await prisma_1.prisma.user.findFirst({
                where: {
                    username: data.username,
                    NOT: { id: userId },
                },
            });
            if (takenByOther) {
                throw new Error("USERNAME_TAKEN");
            }
        }
        if (data.email) {
            const takenByOther = await prisma_1.prisma.user.findFirst({
                where: {
                    email: data.email,
                    NOT: { id: userId },
                },
            });
            if (takenByOther) {
                throw new Error("EMAIL_TAKEN");
            }
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.username && { username: data.username }),
                ...(data.email && { email: data.email }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
            },
        });
        return updatedUser;
    },
};
//# sourceMappingURL=auth.service.js.map