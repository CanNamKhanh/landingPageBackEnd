import "dotenv/config";
import express, { Request, Response } from "express";
import { sheets } from "../libs/googleSheet";

const router = express.Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ message: "API is running. Use POST /submit-form to submit." });
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface BasePayload {
  customerName: string;
  customerEmail: string;
  game: string;
  service: string;
  totalPrice: number;
}

// Valorant – Rank Boosting
interface ValorantRankBoostPayload extends BasePayload {
  service: "Rank Boosting";
  server: string;
  currentRank: string;
  desiredRank: string;
}

// Valorant – Placement Matches
interface ValorantPlacementPayload extends BasePayload {
  service: "Placement Matches";
  server: string;
  numberOfMatches: number;
  previousSeasonRank: string;
}

// Valorant – Net Wins
interface ValorantNetWinsPayload extends BasePayload {
  service: "Net Wins";
  server: string;
  numberOfMatches: number;
  currentRank: string;
}

// Arena Breakout: Infinite – Koens Farming
interface ABIKoensFarmingPayload extends BasePayload {
  service: "Koens Farming";
  amountM: number; // in millions
}

// Arena Breakout: Infinite – Account Leveling
interface ABIAccountLevelingPayload extends BasePayload {
  service: "Account Leveling";
  currentLevel: number;
  targetLevel: number;
}

// Arena Breakout: Infinite – Raid Boost
interface ABIRaidBoostPayload extends BasePayload {
  service: "Raid Boost";
  map: string;
  difficulty: string;
  runs: number;
}

// Arena Breakout: Infinite – Titanium Case
interface ABITitaniumCasePayload extends BasePayload {
  service: "Titanium Case";
  missions: number;
  totalMissions: number;
}

// Delta Force – Tekniq Alloy Farming
interface DFTekniqqAlloyyFarmingPayload extends BasePayload {
  service: "Tekniq Alloy Farming";
  amountM: number;
}

// Delta Force – Account Leveling
interface DFAccountLevelingPayload extends BasePayload {
  service: "Account Leveling";
  selectedRanges: string[]; // e.g. ["Level 1-10", "Level 20-30"]
}

// Delta Force – Hazard Operation
interface DFHazardOperationPayload extends BasePayload {
  service: "Hazard Operation";
  map: string;
  difficulty: string;
  runs: number;
}

// Delta Force – Season Mission
interface DFSeasonMissionPayload extends BasePayload {
  service: "Season Mission";
}

// Delta Force / TFT / LoL – Rank Boosting
interface GenericRankBoostPayload extends BasePayload {
  service: "Rank Boosting";
  currentRank: string;
  desiredRank: string;
  server?: string;
}

type Payload =
  | ValorantRankBoostPayload
  | ValorantPlacementPayload
  | ValorantNetWinsPayload
  | ABIKoensFarmingPayload
  | ABIAccountLevelingPayload
  | ABIRaidBoostPayload
  | ABITitaniumCasePayload
  | DFTekniqqAlloyyFarmingPayload
  | DFAccountLevelingPayload
  | DFHazardOperationPayload
  | DFSeasonMissionPayload
  | GenericRankBoostPayload;

// ─── Detail Formatter ─────────────────────────────────────────────────────────

function formatDetails(payload: Payload): string {
  const { game, service } = payload;

  if (game === "Valorant") {
    if (service === "Rank Boosting") {
      const p = payload as ValorantRankBoostPayload;
      return `Server: ${p.server} | ${p.currentRank} → ${p.desiredRank}`;
    }
    if (service === "Placement Matches") {
      const p = payload as ValorantPlacementPayload;
      return `Server: ${p.server} | ${p.numberOfMatches} matches | Prev rank: ${p.previousSeasonRank}`;
    }
    if (service === "Net Wins") {
      const p = payload as ValorantNetWinsPayload;
      return `Server: ${p.server} | ${p.numberOfMatches} wins | Rank: ${p.currentRank}`;
    }
  }

  if (game === "Arena Breakout: Infinite") {
    if (service === "Koens Farming") {
      const p = payload as ABIKoensFarmingPayload;
      return `${p.amountM}M Koens`;
    }
    if (service === "Account Leveling") {
      const p = payload as ABIAccountLevelingPayload;
      return `Lv ${p.currentLevel} → Lv ${p.targetLevel}`;
    }
    if (service === "Raid Boost") {
      const p = payload as ABIRaidBoostPayload;
      return `Map: ${p.map} | Difficulty: ${p.difficulty} | ${p.runs} runs`;
    }
    if (service === "Titanium Case") {
      const p = payload as ABITitaniumCasePayload;
      return `${p.missions}/${p.totalMissions} missions`;
    }
  }

  if (game === "Delta Force") {
    if (service === "Tekniq Alloy Farming") {
      const p = payload as DFTekniqqAlloyyFarmingPayload;
      return `${p.amountM}M Tekniq Alloy`;
    }
    if (service === "Account Leveling") {
      const p = payload as DFAccountLevelingPayload;
      return `Ranges: ${p.selectedRanges.join(", ")}`;
    }
    if (service === "Hazard Operation") {
      const p = payload as DFHazardOperationPayload;
      return `Map: ${p.map} | Difficulty: ${p.difficulty} | ${p.runs} runs`;
    }
    if (service === "Season Mission") {
      return "Full Safebox Completion";
    }
    if (service === "Rank Boosting") {
      const p = payload as GenericRankBoostPayload;
      return `${p.currentRank} → ${p.desiredRank}`;
    }
  }

  // Generic Rank Boosting (TFT, LoL, etc.)
  if (service === "Rank Boosting") {
    const p = payload as GenericRankBoostPayload;
    const serverPart = p.server ? ` | Server: ${p.server}` : "";
    return `${p.currentRank} → ${p.desiredRank}${serverPart}`;
  }

  return "-";
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/submit-form", async (req: Request, res: Response) => {
  try {
    const payload = req.body as Payload;

    const { customerName, customerEmail, game, service, totalPrice } = payload;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !game ||
      !service ||
      totalPrice == null
    ) {
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
      `$${Number(totalPrice).toFixed(2)}`,
      customerName,
      customerEmail,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: "Orders!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ SUBMIT FORM ERROR:", message);
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
