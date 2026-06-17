import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  changeUserInfoSchema,
} from "../schemas/auth.schema";
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  changePassword,
  getMe,
  changeUserInfo,
} from "../controllers/auth.controller";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(login));
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  asyncHandler(refreshToken),
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.use(authenticate);

router.post("/logout", asyncHandler(logout));
router.get("/me", asyncHandler(getMe));
router.patch(
  "/me",
  validate(changeUserInfoSchema),
  asyncHandler(changeUserInfo),
);
router.patch(
  "/change-password",
  validate(changePasswordSchema),
  asyncHandler(changePassword),
);

export default router;
