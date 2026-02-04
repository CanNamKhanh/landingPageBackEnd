"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPREADSHEET_ID = exports.sheets = void 0;
const googleapis_1 = require("googleapis");
if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error("❌ Missing GOOGLE_CREDENTIALS env");
}
if (!process.env.SPREADSHEET_ID) {
  throw new Error("❌ Missing SPREADSHEET_ID env");
}
// Parse credentials từ ENV
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
// BẮT BUỘC: fix private_key cho Vercel
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
// Google Auth
const auth = new googleapis_1.google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
// Sheets instance
exports.sheets = googleapis_1.google.sheets({
  version: "v4",
  auth,
});
exports.SPREADSHEET_ID = process.env.SPREADSHEET_ID;
//# sourceMappingURL=googleSheet.js.map
