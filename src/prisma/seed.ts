import "dotenv/config";
import { PrismaClient, GameCode, ServiceType, Prisma } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

// ─── GAMES ──────────────────────────────────────────────────────────────────
// code phải khớp đúng enum GameCode trong schema.prisma

const GAMES: Array<{
  code: GameCode;
  name: string;
  iconUrl: string | null;
}> = [
  { code: GameCode.VALORANT, name: "Valorant", iconUrl: null },
  { code: GameCode.LOL, name: "League of Legends", iconUrl: null },
  { code: GameCode.TFT, name: "Teamfight Tactics", iconUrl: null },
  {
    code: GameCode.ARENA_BREAKOUT_INFINITE,
    name: "Arena Breakout: Infinite",
    iconUrl: null,
  },
  { code: GameCode.DELTA_FORCE, name: "Delta Force", iconUrl: null },
];

// ─── GAME SERVICES ──────────────────────────────────────────────────────────
// config là placeholder, dùng để order.service.ts tính totalPrice.
// TODO: thay basePrice/pricePerUnit bằng giá thật của bạn, hoặc bảng giá chi tiết
// hơn (vd rankPriceTable cho RANK_BOOSTING theo từng cặp rank).

const SERVICES_BY_GAME: Record<
  GameCode,
  Array<{ type: ServiceType; name: string; config: Record<string, unknown> }>
> = {
  [GameCode.VALORANT]: [
    {
      type: ServiceType.RANK_BOOSTING,
      name: "Rank Boosting",
      config: { basePrice: 0, pricePerRankStep: 5 }, // TODO: thay bằng bảng giá theo currentRank -> desiredRank
    },
    {
      type: ServiceType.PLACEMENT_MATCHES,
      name: "Placement Matches",
      config: { basePrice: 0, pricePerUnit: 8 }, // pricePerUnit = giá / match
    },
    {
      type: ServiceType.NET_WINS,
      name: "Net Wins",
      config: { basePrice: 0, pricePerUnit: 6 }, // pricePerUnit = giá / win
    },
  ],

  [GameCode.LOL]: [
    {
      type: ServiceType.RANK_BOOSTING,
      name: "Rank Boosting",
      config: { basePrice: 0, pricePerRankStep: 5 },
    },
    {
      type: ServiceType.PLACEMENT_MATCHES,
      name: "Placement Matches",
      config: { basePrice: 0, pricePerUnit: 8 },
    },
  ],

  [GameCode.TFT]: [
    {
      type: ServiceType.RANK_BOOSTING,
      name: "Rank Boosting",
      config: { basePrice: 0, pricePerRankStep: 5 },
    },
    {
      type: ServiceType.PLACEMENT_MATCHES,
      name: "Placement Matches",
      config: { basePrice: 0, pricePerUnit: 8 },
    },
  ],

  [GameCode.ARENA_BREAKOUT_INFINITE]: [
    {
      type: ServiceType.KOENS_FARMING,
      name: "Koens Farming",
      config: { basePrice: 0, pricePerUnit: 3 }, // pricePerUnit = giá / 1 triệu Koens
    },
    {
      type: ServiceType.ACCOUNT_LEVELING,
      name: "Account Leveling",
      config: { basePrice: 0, pricePerLevel: 2 }, // dùng khi details = { currentLevel, targetLevel }
    },
    {
      type: ServiceType.RAID_BOOST,
      name: "Raid Boost",
      config: {
        basePrice: 0,
        pricePerUnit: 10, // pricePerUnit = giá / run
        difficultyMultiplier: { Normal: 1, Lockdown: 1.3, Forbidden: 1.6 },
        maps: [
          "Farm",
          "Valley",
          "Amory",
          "Northridge",
          "TV Station",
          "Airport",
        ],
      },
    },
    {
      type: ServiceType.TITANIUM_CASE,
      name: "Titanium Case",
      // Full set (60 missions) = $100 theo ảnh bạn gửi -> ước lượng ~1.67/mission
      // TODO: xác nhận lại có phải linear hay có mốc giá riêng (vd 1-30 khác 31-60)
      config: { basePrice: 0, pricePerMission: 1.67 },
    },
  ],

  [GameCode.DELTA_FORCE]: [
    {
      type: ServiceType.TEKNIQ_ALLOY_FARMING,
      name: "Tekniq Alloy Farming",
      config: { basePrice: 0, pricePerUnit: 3 },
    },
    {
      type: ServiceType.ACCOUNT_LEVELING,
      name: "Account Leveling",
      // Delta Force dùng multi-select levelRanges (khác ABI dùng currentLevel/targetLevel)
      config: {
        basePrice: 0,
        pricePerRange: 5,
        ranges: ["1-10", "10-20", "20-30", "30-40", "40-50", "50-60"],
      },
    },
    {
      type: ServiceType.HAZARD_OPERATION,
      name: "Hazard Operation",
      config: {
        basePrice: 0,
        pricePerUnit: 10,
        difficultyMultiplier: { Easy: 1, Normal: 1.2, Hard: 1.5 },
        maps: [
          "Zero Dam",
          "Layali Grove",
          "Brakkesh",
          "Space City",
          "Tide Prison",
        ],
      },
    },
    {
      type: ServiceType.SEASON_MISSION,
      name: "Season Mission",
      // Safebox - Full Completion = $200 flat theo ảnh bạn gửi
      config: { basePrice: 200, packageCode: "SAFEBOX_FULL" },
    },
    {
      type: ServiceType.RANK_BOOSTING,
      name: "Rank Boosting",
      // Delta Force không có field server (khác Valorant/LoL/TFT)
      config: { basePrice: 0, pricePerRankStep: 5 },
    },
  ],
};

async function main() {
  console.log("[seed] start");

  for (const gameInput of GAMES) {
    const game = await prisma.game.upsert({
      where: { code: gameInput.code },
      update: { name: gameInput.name, iconUrl: gameInput.iconUrl },
      create: {
        code: gameInput.code,
        name: gameInput.name,
        iconUrl: gameInput.iconUrl,
        isActive: true,
      },
    });
    console.log(`[seed] upserted game: ${game.code} (${game.id})`);

    const services = SERVICES_BY_GAME[gameInput.code];
    for (const serviceInput of services) {
      const service = await prisma.gameService.upsert({
        where: { gameId_type: { gameId: game.id, type: serviceInput.type } },
        update: {
          name: serviceInput.name,
          config: serviceInput.config as Prisma.InputJsonValue,
        },
        create: {
          gameId: game.id,
          type: serviceInput.type,
          name: serviceInput.name,
          config: serviceInput.config as Prisma.InputJsonValue,
          isActive: true,
        },
      });
      console.log(`[seed]   - service: ${service.type} (${service.id})`);
    }
  }

  console.log("[seed] done");
}

main()
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
