import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./src/prisma/models",
  migrations: {
    path: "./src/prisma/migrations",
    seed: "ts-node --transpile-only src/libs/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
