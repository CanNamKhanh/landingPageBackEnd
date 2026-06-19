"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const googleSheet_1 = require("../libs/googleSheet");
const router = express_1.default.Router();
router.get("/", (_req, res) => {
    res.json({ message: "API is running. Use POST /submit-form to submit." });
});
// ─── Detail Formatter ─────────────────────────────────────────────────────────
function formatDetails(payload) {
    const { game, service } = payload;
    if (game === "Valorant") {
        if (service === "Rank Boosting") {
            const p = payload;
            return `Server: ${p.server} | ${p.currentRank} → ${p.desiredRank}`;
        }
        if (service === "Placement Matches") {
            const p = payload;
            return `Server: ${p.server} | ${p.numberOfMatches} matches | Prev rank: ${p.previousSeasonRank}`;
        }
        if (service === "Net Wins") {
            const p = payload;
            return `Server: ${p.server} | ${p.numberOfMatches} wins | Rank: ${p.currentRank}`;
        }
    }
    if (game === "Arena Breakout: Infinite") {
        if (service === "Koens Farming") {
            const p = payload;
            return `${p.amountM}M Koens`;
        }
        if (service === "Account Leveling") {
            const p = payload;
            return `Lv ${p.currentLevel} → Lv ${p.targetLevel}`;
        }
        if (service === "Raid Boost") {
            const p = payload;
            return `Map: ${p.map} | Difficulty: ${p.difficulty} | ${p.runs} runs`;
        }
        if (service === "Titanium Case") {
            const p = payload;
            return `${p.missions}/${p.totalMissions} missions`;
        }
    }
    if (game === "Delta Force") {
        if (service === "Tekniq Alloy Farming") {
            const p = payload;
            return `${p.amountM}M Tekniq Alloy`;
        }
        if (service === "Account Leveling") {
            const p = payload;
            return `Ranges: ${p.selectedRanges.join(", ")}`;
        }
        if (service === "Hazard Operation") {
            const p = payload;
            return `Map: ${p.map} | Difficulty: ${p.difficulty} | ${p.runs} runs`;
        }
        if (service === "Season Mission") {
            return "Full Safebox Completion";
        }
        if (service === "Rank Boosting") {
            const p = payload;
            return `${p.currentRank} → ${p.desiredRank}`;
        }
    }
    // Generic Rank Boosting (TFT, LoL, etc.)
    if (service === "Rank Boosting") {
        const p = payload;
        const serverPart = p.server ? ` | Server: ${p.server}` : "";
        return `${p.currentRank} → ${p.desiredRank}${serverPart}`;
    }
    return "-";
}
// ─── Price Formatter ──────────────────────────────────────────────────────────
function formatPrice(totalPrice) {
    if (typeof totalPrice === "string")
        return totalPrice;
    return `$${totalPrice.toFixed(2)}`;
}
// ─── Route ────────────────────────────────────────────────────────────────────
router.post("/submit-form", async (req, res) => {
    try {
        const payload = req.body;
        const { customerName, customerEmail, game, service, totalPrice } = payload;
        // Validate required fields
        if (!customerName ||
            !customerEmail ||
            !game ||
            !service ||
            totalPrice == null) {
            res
                .status(400)
                .json({ success: false, error: "Missing required fields." });
            return;
        }
        const details = formatDetails(payload);
        const date = new Date().toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        // Columns: Date | Game | Service | Details | Total Price | Customer Name | Customer Email
        const row = [
            date,
            game,
            service,
            details,
            formatPrice(totalPrice),
            customerName,
            customerEmail,
        ];
        await googleSheet_1.sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range: "Trang tính1!A:G",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [row] },
        });
        res.json({ success: true });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ SUBMIT FORM ERROR:", message);
        res.status(500).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=form.route.js.map