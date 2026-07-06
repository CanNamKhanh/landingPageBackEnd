import "dotenv/config";
import express, { Request, Response } from "express";
import { sheets } from "../libs/googleSheet";

const router = express.Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ message: "API is running. Use POST /submit-form to submit." });
});

interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/submit-form", async (req: Request, res: Response) => {
  try {
    const payload = req.body as ContactFormPayload;

    const { name, email, subject, message } = payload;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      res
        .status(400)
        .json({ success: false, error: "Missing required fields." });
      return;
    }

    const date = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Columns: Date | Name | Email | Subject | Message
    const row = [date, name, email, subject, message];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: "Trang tính2!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    res.json({ success: true });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ SUBMIT FORM ERROR:", errMessage);
    res.status(500).json({ success: false, error: errMessage });
  }
});

export default router;
