"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const prisma_1 = require("../generated/prisma");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const adapter = new adapter_mariadb_1.PrismaMariaDb(process.env.DATABASE_URL);
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ??
    new prisma_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["error"],
        // omit: {
        //   user: {
        //     passwordHash: true,
        //   },
        // },
    });
exports.prisma = prisma;
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
//# sourceMappingURL=prisma.js.map