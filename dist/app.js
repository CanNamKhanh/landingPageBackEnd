"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const form_route_1 = __importDefault(require("./routes/form.route"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", form_route_1.default);
app.get("/", (req, res) => {
    res.send("OK");
});
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
//# sourceMappingURL=app.js.map