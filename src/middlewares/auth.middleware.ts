import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { redisClient } from "../libs/redis";
import { logger } from "../utils/logger";
import { prisma } from "../libs/prisma";

const log = logger.scope("AuthMiddleware");

// Global augmentation: để các controller dùng `req.user!.id` trên type Request
// thẳng (như order.controller.ts, booster.controller.ts, chat.controller.ts đã viết)
// không cần ép kiểu lại thành AuthRequest mỗi lần.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      token?: string;
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

// Giữ lại type AuthRequest để tương thích code cũ của bạn (import { AuthRequest } ở nơi khác)
export type AuthRequest = Request;

interface TokenPayload extends JwtPayload {
  userId: string;
  // CHƯA có trong token hiện tại của bạn - xem PHƯƠNG ÁN 2 bên dưới để thêm vào lúc sign
  role?: Role;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
    const decoded = jwt.verify(token, secret) as unknown as TokenPayload;

    if (!decoded || typeof decoded === "string" || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token payload",
      });
      return;
    }

    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Token has been revoked",
      });
      return;
    }

    // PHƯƠNG ÁN 1 (fallback hiện tại): token chưa có role -> query DB lấy role.
    // Nếu bạn áp dụng PHƯƠNG ÁN 2 (nhúng role vào token lúc login) thì có thể
    // bỏ block if dưới và chỉ dùng decoded.role, đỡ tốn 1 query/request.
    let role = decoded.role;
    if (!role) {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true },
      });
      if (!dbUser) {
        log.warn("user not found for valid token", { userId: decoded.userId });
        res.status(401).json({
          success: false,
          message: "Unauthorized: User not found",
        });
        return;
      }
      role = dbUser.role;
    }

    req.userId = decoded.userId;
    req.token = token;
    req.user = { id: decoded.userId, role };

    log.debug("authenticated", { userId: decoded.userId, role });
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};

/**
 * Chặn theo role, dùng sau authenticate.
 * Ví dụ: router.post("/boosters", authenticate, requireRole(Role.ADMIN), handler)
 */
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      log.warn("forbidden", {
        userId: req.user.id,
        role: req.user.role,
        allowedRoles,
        path: req.originalUrl,
      });
      res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
};
