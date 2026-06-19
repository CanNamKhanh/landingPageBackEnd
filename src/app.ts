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

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log("CORS:", ALLOWED_ORIGINS);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

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
