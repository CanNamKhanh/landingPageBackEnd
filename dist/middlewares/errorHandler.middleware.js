"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
// ─── Custom error class ────────────────────────────────────────────────────────
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
// ─── Service error → HTTP status map ──────────────────────────────────────────
const SERVICE_ERROR_MAP = {
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
const errorHandler = (error, _req, res, _next) => {
    // Known AppError (thrown explicitly)
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.middleware.js.map