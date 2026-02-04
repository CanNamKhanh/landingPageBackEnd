import "dotenv/config";
import { google } from "googleapis";
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS!);
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({
  version: "v4",
  auth,
});
