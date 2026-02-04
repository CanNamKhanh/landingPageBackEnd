"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheets = void 0;
// libs/googleSheet.ts
const googleapis_1 = require("googleapis");
// const auth = new google.auth.GoogleAuth({
//   keyFile: path.resolve("service-account.json"),
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });
// export const sheets = google.sheets({
//   version: "v4",
//   auth,
// });
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}");
const auth = new googleapis_1.google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
exports.sheets = googleapis_1.google.sheets({
    version: "v4",
    auth,
});
//# sourceMappingURL=googleSheet.js.map