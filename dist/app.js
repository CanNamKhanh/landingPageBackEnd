"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const form_route_1 = __importDefault(require("./routes/form.route"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "https://rosie-boost.vercel.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
}));
app.use(express_1.default.json());
app.use("/api", form_route_1.default);
app.get("/", (req, res) => {
    res.send("OK");
});
// app.options("/*", (req, res) => {
//   res.sendStatus(204);
// });
exports.default = app;
//# sourceMappingURL=app.js.map