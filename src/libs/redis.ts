import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("[Redis] Connection error:", err);
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected successfully");
});

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
};

// ─── Prefix keys ──────────────────────────────────────────────────────────────

const BLACKLIST_PREFIX = "blacklist:";
const RESET_TOKEN_PREFIX = "reset_token:";

// ─── Blacklist helpers ────────────────────────────────────────────────────────

export const blacklistToken = async (
  token: string,
  ttlSeconds: number,
): Promise<void> => {
  await redisClient.set(`${BLACKLIST_PREFIX}${token}`, "1", {
    EX: ttlSeconds,
  });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(`${BLACKLIST_PREFIX}${token}`);
  return result !== null;
};

// ─── Reset token helpers ──────────────────────────────────────────────────────

export const saveResetToken = async (
  email: string,
  token: string,
  ttlSeconds: number,
): Promise<void> => {
  await redisClient.set(`${RESET_TOKEN_PREFIX}${token}`, email, {
    EX: ttlSeconds,
  });
};

export const getEmailByResetToken = async (
  token: string,
): Promise<string | null> => {
  return redisClient.get(`${RESET_TOKEN_PREFIX}${token}`);
};

export const deleteResetToken = async (token: string): Promise<void> => {
  await redisClient.del(`${RESET_TOKEN_PREFIX}${token}`);
};
