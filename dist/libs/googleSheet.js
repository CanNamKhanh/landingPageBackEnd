"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheets = void 0;
require("dotenv/config");
const googleapis_1 = require("googleapis");
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
const auth = new googleapis_1.google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
exports.sheets = googleapis_1.google.sheets({
    version: "v4",
    auth,
});
//# sourceMappingURL=googleSheet.js.map