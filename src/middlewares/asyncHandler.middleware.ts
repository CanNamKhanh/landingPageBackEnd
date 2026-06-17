import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "./auth.middleware";
import { prisma } from "../libs/prisma";

// ─── asyncHandler ─────────────────────────────────────────────────────────────
// Wraps async route handlers so thrown errors are forwarded to errorHandler.

export const asyncHandler = (
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as AuthRequest, res, next).catch(next);
  };
};
