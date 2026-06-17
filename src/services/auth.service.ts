import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ChangePasswordInput,
  ChangeUserInfoInput,
} from "../schemas/auth.schema";
import { prisma } from "../libs/prisma";
import { redisClient } from "../libs/redis";
import { TokenPair, UserProfile } from "../types/index.type";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRED = process.env.JWT_EXPIRED || "1h";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_REFRESH_EXPIRED = process.env.JWT_REFRESH_EXPIRED || "7d";

// Redis TTL in seconds (must match token expiry)
const ACCESS_TOKEN_TTL = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRED,
  } as jwt.SignOptions);
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRED,
  } as jwt.SignOptions);
};

export const authService = {
  // ─── REGISTER ────────────────────────────────────────────────────────────────

  async registerService(data: RegisterInput): Promise<UserProfile> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error("EMAIL_TAKEN");
      }
      throw new Error("USERNAME_TAKEN");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  },

  // ─── LOGIN ────────────────────────────────────────────────────────────────────

  async loginService(data: LoginInput): Promise<TokenPair> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}:${refreshToken}`, "valid", {
      EX: REFRESH_TOKEN_TTL,
    });

    return { accessToken, refreshToken };
  },

  // ─── LOGOUT ───────────────────────────────────────────────────────────────────

  async logoutService(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    // Blacklist the access token
    await redisClient.set(`blacklist:${accessToken}`, "revoked", {
      EX: ACCESS_TOKEN_TTL,
    });

    // Remove the refresh token
    await redisClient.del(`refresh_token:${userId}:${refreshToken}`);
  },

  // ─── REFRESH TOKEN ─────────────────────────────────────────────────────────────

  async refreshTokenService(data: RefreshTokenInput): Promise<TokenPair> {
    let decoded: { userId: string };

    try {
      decoded = jwt.verify(data.refreshToken, JWT_REFRESH_SECRET) as {
        userId: string;
      };
    } catch {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    const storedToken = await redisClient.get(
      `refresh_token:${decoded.userId}:${data.refreshToken}`,
    );

    if (!storedToken) {
      throw new Error("REFRESH_TOKEN_REVOKED");
    }

    // Rotate: delete old, issue new pair
    await redisClient.del(
      `refresh_token:${decoded.userId}:${data.refreshToken}`,
    );

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    await redisClient.set(
      `refresh_token:${decoded.userId}:${newRefreshToken}`,
      "valid",
      { EX: REFRESH_TOKEN_TTL },
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

  async forgotPasswordService(data: ForgotPasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all refresh tokens for this user after password change
    // (pattern delete — only works if Redis supports SCAN or you track tokens)
    // Simple approach: we can't wildcard-delete without SCAN, so we just trust
    // that existing tokens expire naturally. For stricter security, use a versioned key.
  },

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────

  async changePasswordService(
    userId: string,
    data: ChangePasswordInput,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new Error("WRONG_CURRENT_PASSWORD");
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  },

  // ─── GET ME ────────────────────────────────────────────────────────────────────

  async getMeService(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return user;
  },

  // ─── CHANGE USER INFO ──────────────────────────────────────────────────────────

  async changeUserInfoService(
    userId: string,
    data: ChangeUserInfoInput,
  ): Promise<UserProfile> {
    if (data.username) {
      const takenByOther = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      });

      if (takenByOther) {
        throw new Error("USERNAME_TAKEN");
      }
    }

    if (data.email) {
      const takenByOther = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id: userId },
        },
      });

      if (takenByOther) {
        throw new Error("EMAIL_TAKEN");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.email && { email: data.email }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return updatedUser;
  },
};
