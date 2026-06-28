import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

// ─── Custom error class ────────────────────────────────────────────────────────

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// ─── Service error → HTTP status map ──────────────────────────────────────────

const SERVICE_ERROR_MAP: Record<
  string,
  { statusCode: number; message: string }
> = {
  EMAIL_TAKEN: { statusCode: 409, message: "Email is already taken" },
  USERNAME_TAKEN: { statusCode: 409, message: "Username is already taken" },
  INVALID_CREDENTIALS: {
    statusCode: 401,
    message: "Invalid email or password",
  },
  INVALID_REFRESH_TOKEN: { statusCode: 401, message: "Invalid refresh token" },
  REFRESH_TOKEN_REVOKED: {
    statusCode: 401,
    message: "Refresh token has been revoked",
  },
  USER_NOT_FOUND: { statusCode: 404, message: "User not found" },
  WRONG_CURRENT_PASSWORD: {
    statusCode: 400,
    message: "Current password is incorrect",
  },
};

// ─── Global error handler ─────────────────────────────────────────────────────

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod validation error (body/query parse sai shape) — thêm mới, check trước AppError
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: error.issues,
    });
    return;
  }

  // Known AppError (thrown explicitly)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  // Prisma known errors (unique constraint, record not found...) — thêm mới
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "Resource already exists",
      });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Record not found",
      });
      return;
    }

    console.error("[Prisma Error]", error.code, error.meta);
    res.status(500).json({
      success: false,
      message: "Database error",
    });
    return;
  }

  // Service errors (thrown as plain Error with a known code)
  if (error instanceof Error) {
    const mapped = SERVICE_ERROR_MAP[error.message];
    if (mapped) {
      res.status(mapped.statusCode).json({
        success: false,
        message: mapped.message,
      });
      return;
    }

    // Unknown runtime error — log it and return a generic 500
    console.error("[Unhandled Error]", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
    return;
  }

  // Completely unknown throw
  console.error("[Unknown throw]", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
