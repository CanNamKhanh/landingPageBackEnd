"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
// ─── asyncHandler ─────────────────────────────────────────────────────────────
// Wraps async route handlers so thrown errors are forwarded to errorHandler.
const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=asyncHandler.middleware.js.map