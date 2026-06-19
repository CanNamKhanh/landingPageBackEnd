"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../libs/redis");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided",
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided",
        });
        return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded || typeof decoded === "string" || !decoded.userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid token payload",
            });
            return;
        }
        const isBlacklisted = await redis_1.redisClient.get(`blacklist:${token}`);
        if (isBlacklisted) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: Token has been revoked",
            });
            return;
        }
        req.userId = decoded.userId;
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid or expired token",
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map