"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const prisma_1 = require("../libs/prisma");
const prisma_2 = require("@prisma/client");
// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Must be placed AFTER the authenticate middleware.
const requireAdmin = async (req, res, next) => {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }
  const user = await prisma_1.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== prisma_2.Role.ADMIN) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Admins only",
    });
    return;
  }
  next();
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=requireAdmin.middleware.js.map
