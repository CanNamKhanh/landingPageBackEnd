import express, { Request, Response } from "express";
import { sheets } from "googleapis/build/src/apis/sheets";
import { getSheets } from "../libs/googleSheet";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Router API đang hoạt động, hãy dùng POST để gửi form!",
  });
});

router.post("/submit-form", async (req: Request, res: Response) => {
  const sheets = getSheets();

  try {
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
