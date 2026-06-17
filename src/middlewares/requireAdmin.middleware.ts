import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { prisma } from "../libs/prisma";
import { Role } from "../generated/prisma";

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Must be placed AFTER the authenticate middleware.

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== Role.ADMIN) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Admins only",
    });
    return;
  }

  next();
};
