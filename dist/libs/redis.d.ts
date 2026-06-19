export declare const redisClient: import("redis").RedisClientType<{}, {}, {}, 3, {}>;
export declare const connectRedis: () => Promise<void>;
export declare const blacklistToken: (token: string, ttlSeconds: number) => Promise<void>;
export declare const isTokenBlacklisted: (token: string) => Promise<boolean>;
export declare const saveResetToken: (email: string, token: string, ttlSeconds: number) => Promise<void>;
export declare const getEmailByResetToken: (token: string) => Promise<string | null>;
export declare const deleteResetToken: (token: string) => Promise<void>;
//# sourceMappingURL=redis.d.ts.map