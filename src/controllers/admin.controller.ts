import { Response } from "express";
import { adminService } from "../services/admin.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { GetAllUsersInput } from "../schemas/admin.schema";

// ─── GET ALL USERS (paginated, searchable) ────────────────────────────────────

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const query = req.query as unknown as GetAllUsersInput;

  const result = await adminService.getAllUsersService(query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

// ─── GET ONE USER'S DETAIL ─────────────────────────────────────────────────────

export const getUserDetail = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { userId } = req.params as { userId: string };

  const user = await adminService.getUserDetailService(userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
};

// ─── GET ONE USER'S CONVERSATIONS (AI + ADMIN) ────────────────────────────────

export const getUserConversations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { userId } = req.params as { userId: string };

  const result = await adminService.getUserConversationsService(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
};

// ─── GET ALL USERS WITH ALL THEIR CONVERSATIONS (full dump) ──────────────────

export const getAllUsersWithConversations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const result = await adminService.getAllUsersWithConversationsService();

  res.status(200).json({
    success: true,
    data: { users: result },
  });
};
