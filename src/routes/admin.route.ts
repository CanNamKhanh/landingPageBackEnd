import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/requireAdmin.middleware";
import { validate } from "../middlewares/validate.middleware";
import { getAllUsersSchema } from "../schemas/admin.schema";
import {
  getAllUsers,
  getUserDetail,
  getUserConversations,
  getAllUsersWithConversations,
} from "../controllers/admin.controller";

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate, requireAdmin);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get("/users", validate(getAllUsersSchema), asyncHandler(getAllUsers));
router.get("/users/:userId", asyncHandler(getUserDetail));

// ─── Conversations ────────────────────────────────────────────────────────────
router.get("/users/:userId/conversations", asyncHandler(getUserConversations));
router.get("/conversations", asyncHandler(getAllUsersWithConversations));

export default router;
