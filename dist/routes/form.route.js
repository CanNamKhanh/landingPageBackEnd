"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/form.route.ts
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const googleSheet_1 = require("../libs/googleSheet");
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.json({
        message: "Router API đang hoạt động, hãy dùng POST để gửi form!",
    });
});
router.post("/submit-form", async (req, res) => {
    console.log("BODY:", req.body);
    console.log("HAS CREDS:", !!process.env.GOOGLE_CREDENTIALS);
    console.log("SHEET ID:", process.env.SPREADSHEET_ID);
    try {
        const { name, email, contactMethod, contactInfo, game, paymentMethod, boostingRequirements, } = req.body;
        await googleSheet_1.sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});
exports.default = router;
//# sourceMappingURL=form.route.js.map