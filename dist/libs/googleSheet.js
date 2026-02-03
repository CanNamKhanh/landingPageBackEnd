"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheets = void 0;
// libs/googleSheet.ts
const googleapis_1 = require("googleapis");
const path_1 = __importDefault(require("path"));
const auth = new googleapis_1.google.auth.GoogleAuth({
    keyFile: path_1.default.resolve("service-account.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
exports.sheets = googleapis_1.google.sheets({
    version: "v4",
    auth,
});
//# sourceMappingURL=googleSheet.js.map