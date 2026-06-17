import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redisClient } from "../libs/redis";

export interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

interface TokenPayload extends JwtPayload {
  userId: string;
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

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};
