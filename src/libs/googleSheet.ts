import { google } from "googleapis";

if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error("Missing GOOGLE_CREDENTIALS env");
}

if (!process.env.SPREADSHEET_ID) {
  throw new Error("Missing SPREADSHEET_ID env");
}

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

// Google Auth
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Sheets instance
export const sheets = google.sheets({
  version: "v4",
  auth,
});

export const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
