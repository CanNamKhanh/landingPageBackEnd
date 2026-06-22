import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import formRoute from "./routes/form.route";
import paypalRouter from "./routes/paypal.route";
import authRouter from "./routes/auth.route";
import adminRouter from "./routes/admin.route";
import conversationRouter from "./routes/conversation.route";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { connectRedis } from "./libs/redis";

const PORT: number = Number(process.env.PORT) || 4000;
const app = express();
const httpServer = http.createServer(app);

const RAW_CORS_ORIGIN = process.env.CORS_ORIGIN ?? "";
//bug logs
console.log("=== CORS DEBUG ===");
console.log("RAW CORS_ORIGIN env:", JSON.stringify(RAW_CORS_ORIGIN));

const ALLOWED_ORIGINS = RAW_CORS_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

console.log("ALLOWED_ORIGINS parsed:", ALLOWED_ORIGINS);
console.log("==================");

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    console.log(`[CORS] Incoming origin: ${JSON.stringify(origin)}`);
    console.log(`[CORS] Allowed list: ${JSON.stringify(ALLOWED_ORIGINS)}`);

    if (!origin) {
      console.log("[CORS] No origin → ALLOWED (Postman/server)");
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");
    console.log(
      `[CORS] Normalized origin: ${JSON.stringify(normalizedOrigin)}`,
    );

    const isAllowed = ALLOWED_ORIGINS.includes(normalizedOrigin);
    console.log(`[CORS] Match result: ${isAllowed}`);

    if (isAllowed) {
      console.log("[CORS] ✅ ALLOWED");
      return callback(null, true);
    }

    console.log("[CORS] ❌ BLOCKED");
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Xử lý preflight OPTIONS
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("OK");
});

app.use("/api", formRoute);
app.use("/paypal", paypalRouter);
app.use("/auth", authRouter);
app.use("/conversations", conversationRouter);
app.use("/admin", adminRouter);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await connectRedis();

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});

export default app;
