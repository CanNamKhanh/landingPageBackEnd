"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResetToken = exports.getEmailByResetToken = exports.saveResetToken = exports.isTokenBlacklisted = exports.blacklistToken = exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
});
exports.redisClient.on("error", (err) => {
    console.error("[Redis] Connection error:", err);
});
exports.redisClient.on("connect", () => {
    console.log("[Redis] Connected successfully");
});
const connectRedis = async () => {
    await exports.redisClient.connect();
};
exports.connectRedis = connectRedis;
// ─── Prefix keys ──────────────────────────────────────────────────────────────
const BLACKLIST_PREFIX = "blacklist:";
const RESET_TOKEN_PREFIX = "reset_token:";
// ─── Blacklist helpers ────────────────────────────────────────────────────────
const blacklistToken = async (token, ttlSeconds) => {
    await exports.redisClient.set(`${BLACKLIST_PREFIX}${token}`, "1", {
        EX: ttlSeconds,
    });
};
exports.blacklistToken = blacklistToken;
const isTokenBlacklisted = async (token) => {
    const result = await exports.redisClient.get(`${BLACKLIST_PREFIX}${token}`);
    return result !== null;
};
exports.isTokenBlacklisted = isTokenBlacklisted;
// ─── Reset token helpers ──────────────────────────────────────────────────────
const saveResetToken = async (email, token, ttlSeconds) => {
    await exports.redisClient.set(`${RESET_TOKEN_PREFIX}${token}`, email, {
        EX: ttlSeconds,
    });
};
exports.saveResetToken = saveResetToken;
const getEmailByResetToken = async (token) => {
    return exports.redisClient.get(`${RESET_TOKEN_PREFIX}${token}`);
};
exports.getEmailByResetToken = getEmailByResetToken;
const deleteResetToken = async (token) => {
    await exports.redisClient.del(`${RESET_TOKEN_PREFIX}${token}`);
};
exports.deleteResetToken = deleteResetToken;
//# sourceMappingURL=redis.js.map