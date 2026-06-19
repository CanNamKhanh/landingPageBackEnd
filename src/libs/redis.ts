import { Redis } from "@upstash/redis";

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.error(
    "[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables",
  );
}

export const redisClient = new Redis({
  url: UPSTASH_REDIS_REST_URL ?? "",
  token: UPSTASH_REDIS_REST_TOKEN ?? "",
});

// Không cần connectRedis() nữa vì REST API không cần "connect" trước,
// mỗi lệnh là một HTTP request riêng biệt nên không có socket nào để giữ/đóng.
export const connectRedis = async (): Promise<void> => {
  console.log(
    "[Redis] Using Upstash REST API — no persistent connection needed",
  );
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
    ex: ttlSeconds,
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
    ex: ttlSeconds,
  });
};

export const getEmailByResetToken = async (
  token: string,
): Promise<string | null> => {
  return redisClient.get<string>(`${RESET_TOKEN_PREFIX}${token}`);
};

export const deleteResetToken = async (token: string): Promise<void> => {
  await redisClient.del(`${RESET_TOKEN_PREFIX}${token}`);
};
