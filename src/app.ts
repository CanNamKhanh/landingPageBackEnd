import "dotenv/config";
import express from "express";
import cors from "cors";
import formRoute from "./routes/form.route";
import paypalRouter from "./routes/paypal.route";
import authRouter from "./routes/auth.route";
import conversationRouter from "./routes/conversation.route";
import { errorHandler } from "./middlewares/errorHandler.middleware";

const app = express();

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
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

app.use(errorHandler);

export default app;
