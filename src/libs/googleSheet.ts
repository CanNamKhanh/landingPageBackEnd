// libs/googleSheet.ts
import { google } from "googleapis";
import path from "path";

const rawCreds = process.env.GOOGLE_CREDENTIALS;

if (!rawCreds) {
  throw new Error("Missing GOOGLE_CREDENTIALS");
}

const credentials = JSON.parse(rawCreds);

// FIX PRIVATE KEY
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({
  version: "v4",
  auth,
});
