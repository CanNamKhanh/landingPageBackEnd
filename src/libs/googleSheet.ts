// libs/googleSheet.ts
import { google } from "googleapis";
import path from "path";

// const auth = new google.auth.GoogleAuth({
//   keyFile: path.resolve("service-account.json"),
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// export const sheets = google.sheets({
//   version: "v4",
//   auth,
// });

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({
  version: "v4",
  auth,
});
