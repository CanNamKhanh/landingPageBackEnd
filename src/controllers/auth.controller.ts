import { Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ChangePasswordInput,
  ChangeUserInfoInput,
} from "../schemas/auth.schema";

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const body = req.body as RegisterInput;

  const user = await authService.registerService(body);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user },
  });
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = req.body as LoginInput;

  const tokens = await authService.loginService(body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: tokens,
  });
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export const logout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const accessToken = req.token as string;
  const { refreshToken } = req.body as { refreshToken: string };

  await authService.logoutService(userId, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

export const refreshToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const body = req.body as RefreshTokenInput;

  const tokens = await authService.refreshTokenService(body);

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: tokens,
  });
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

export const forgotPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const body = req.body as ForgotPasswordInput;

  await authService.forgotPasswordService(body);

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const body = req.body as ChangePasswordInput;

  await authService.changePasswordService(userId, body);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
};

// ─── GET ME ───────────────────────────────────────────────────────────────────

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId as string;

  const user = await authService.getMeService(userId);

  res.status(200).json({
    success: true,
    data: { user },
  });
};

// ─── CHANGE USER INFO ──────────────────────────────────────────────────────────

export const changeUserInfo = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId as string;
  const body = req.body as ChangeUserInfoInput;

  const user = await authService.changeUserInfoService(userId, body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
};
