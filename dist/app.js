"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const form_route_1 = __importDefault(require("./routes/form.route"));
const paypal_route_1 = __importDefault(require("./routes/paypal.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const admin_route_1 = __importDefault(require("./routes/admin.route"));
const conversation_route_1 = __importDefault(require("./routes/conversation.route"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const redis_1 = require("./libs/redis");
const PORT = Number(process.env.PORT) || 4000;
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
console.log("CORS:", ALLOWED_ORIGINS);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("OK");
});
app.use("/api", form_route_1.default);
app.use("/paypal", paypal_route_1.default);
app.use("/auth", auth_route_1.default);
app.use("/conversations", conversation_route_1.default);
app.use("/admin", admin_route_1.default);
app.use(errorHandler_middleware_1.errorHandler);
async function bootstrap() {
    await (0, redis_1.connectRedis)();
    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}
bootstrap().catch((err) => {
    console.error("[Server] Failed to start:", err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map