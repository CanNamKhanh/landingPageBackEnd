import "dotenv/config";
import express, { Request, Response } from "express";
import { sheets } from "../libs/googleSheet";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Router API đang hoạt động, hãy dùng POST để gửi form!",
  });
});

router.post("/submit-form", async (req: Request, res: Response) => {
  try {
    console.log("ENV CHECK:", {
      spreadsheetId: process.env.SPREADSHEET_ID,
      hasCredentials: !!process.env.GOOGLE_CREDENTIALS,
    });
    console.log("hello");
    const {
      name,
      email,
      contactMethod,
      contactInfo,
      game,
      paymentMethod,
      boostingRequirements,
    } = req.body;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: "Trang tính1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            name,
            email,
            contactMethod,
            contactInfo,
            game,
            paymentMethod,
            boostingRequirements,
          ],
        ],
      },
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("❌ SUBMIT FORM ERROR:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
