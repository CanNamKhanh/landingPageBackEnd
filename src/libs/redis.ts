import { Redis } from "@upstash/redis";

export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Không cần connectRedis() nữa vì REST API không cần "connect" trước
export const connectRedis = async (): Promise<void> => {
  console.log(
    "[Redis] Using Upstash REST API — no persistent connection needed",
  );
};

const BLACKLIST_PREFIX = "blacklist:";
const RESET_TOKEN_PREFIX = "reset_token:";

export const blacklistToken = async (
  token: string,
  ttlSeconds: number,
): Promise<void> => {
  await redisClient.set(`${BLACKLIST_PREFIX}${token}`, "1", { ex: ttlSeconds });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redisClient.get(`${BLACKLIST_PREFIX}${token}`);
  return result !== null;
};

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
  return redisClient.get(`${RESET_TOKEN_PREFIX}${token}`);
};

export const deleteResetToken = async (token: string): Promise<void> => {
  await redisClient.del(`${RESET_TOKEN_PREFIX}${token}`);
};
