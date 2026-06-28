import { z } from "zod";

/**
 * Mỗi schema dưới đây mô tả shape của field `Order.details` (Json)
 * tương ứng với 1 giá trị của enum ServiceType trong Prisma.
 *
 * Khi tạo order, BE phải:
 *  1. Lookup GameService theo (gameId, serviceType) để biết config (server list, rank list, ...)
 *  2. Lấy schema tương ứng từ `orderDetailsSchemaMap`
 *  3. Parse `details` thô từ FE bằng schema đó (throw nếu invalid)
 *  4. Optionally validate thêm theo `config` (vd: rank phải nằm trong list rank của game đó)
 */

// ---------- Các enum dùng chung (rank/server có thể khác nhau theo game, nhưng FE luôn gửi string) ----------

const nonEmptyString = z.string().trim().min(1);

// ---------- RANK_BOOSTING ----------
// Valorant/LoL/TFT: { server, currentRank, desiredRank }
// Delta Force:      { currentRank, desiredRank } (không có server)
export const rankBoostingDetailsSchema = z.object({
  server: nonEmptyString.optional(),
  currentRank: nonEmptyString,
  desiredRank: nonEmptyString,
});
export type RankBoostingDetails = z.infer<typeof rankBoostingDetailsSchema>;

// ---------- PLACEMENT_MATCHES ----------
// { server, numberOfMatches, previousSeasonRank }
export const placementMatchesDetailsSchema = z.object({
  server: nonEmptyString,
  numberOfMatches: z.number().int().min(1).max(20),
  previousSeasonRank: nonEmptyString,
});
export type PlacementMatchesDetails = z.infer<
  typeof placementMatchesDetailsSchema
>;

// ---------- NET_WINS ----------
// Valorant only: { server, numberOfMatches, currentRank }
export const netWinsDetailsSchema = z.object({
  server: nonEmptyString,
  numberOfMatches: z.number().int().min(1).max(50),
  currentRank: nonEmptyString,
});
export type NetWinsDetails = z.infer<typeof netWinsDetailsSchema>;

// ---------- KOENS_FARMING / TEKNIQ_ALLOY_FARMING ----------
// { amount } - đơn vị triệu (M), tuỳ config quantity options
export const farmingDetailsSchema = z.object({
  amount: z.number().int().positive(),
});
export type FarmingDetails = z.infer<typeof farmingDetailsSchema>;

// ---------- ACCOUNT_LEVELING ----------
// ABI: { currentLevel, targetLevel } (range liên tục)
// Delta Force: { levelRanges: string[] } (multi-select, vd ["1-10","30-40"])
export const accountLevelingDetailsSchema = z.union([
  z.object({
    currentLevel: z.number().int().min(1),
    targetLevel: z.number().int().min(1),
  }),
  z.object({
    levelRanges: z.array(nonEmptyString).min(1),
  }),
]);
export type AccountLevelingDetails = z.infer<
  typeof accountLevelingDetailsSchema
>;

// ---------- RAID_BOOST / HAZARD_OPERATION ----------
// { map, difficulty, quantity }
export const raidHazardDetailsSchema = z.object({
  map: nonEmptyString,
  difficulty: nonEmptyString,
  quantity: z.number().int().min(1).max(100),
});
export type RaidHazardDetails = z.infer<typeof raidHazardDetailsSchema>;

// ---------- TITANIUM_CASE ----------
// { missionsToComplete } 1-60
export const titaniumCaseDetailsSchema = z.object({
  missionsToComplete: z.number().int().min(1).max(60),
});
export type TitaniumCaseDetails = z.infer<typeof titaniumCaseDetailsSchema>;

// ---------- SEASON_MISSION ----------
// Flat price, không có input động ngoài việc chọn package (hiện tại chỉ có 1: Safebox Full)
export const seasonMissionDetailsSchema = z.object({
  packageCode: z.literal("SAFEBOX_FULL").default("SAFEBOX_FULL"),
});
export type SeasonMissionDetails = z.infer<typeof seasonMissionDetailsSchema>;

// ---------- Map serviceType -> schema ----------
// Dùng đúng tên giá trị enum ServiceType trong schema.prisma
export const orderDetailsSchemaMap = {
  RANK_BOOSTING: rankBoostingDetailsSchema,
  PLACEMENT_MATCHES: placementMatchesDetailsSchema,
  NET_WINS: netWinsDetailsSchema,
  KOENS_FARMING: farmingDetailsSchema,
  TEKNIQ_ALLOY_FARMING: farmingDetailsSchema,
  ACCOUNT_LEVELING: accountLevelingDetailsSchema,
  RAID_BOOST: raidHazardDetailsSchema,
  HAZARD_OPERATION: raidHazardDetailsSchema,
  TITANIUM_CASE: titaniumCaseDetailsSchema,
  SEASON_MISSION: seasonMissionDetailsSchema,
} as const;

export type ServiceTypeKey = keyof typeof orderDetailsSchemaMap;

export type OrderDetailsByServiceType = {
  RANK_BOOSTING: RankBoostingDetails;
  PLACEMENT_MATCHES: PlacementMatchesDetails;
  NET_WINS: NetWinsDetails;
  KOENS_FARMING: FarmingDetails;
  TEKNIQ_ALLOY_FARMING: FarmingDetails;
  ACCOUNT_LEVELING: AccountLevelingDetails;
  RAID_BOOST: RaidHazardDetails;
  HAZARD_OPERATION: RaidHazardDetails;
  TITANIUM_CASE: TitaniumCaseDetails;
  SEASON_MISSION: SeasonMissionDetails;
};

/**
 * Validate `details` thô (unknown, từ request body) theo serviceType.
 * Throw ZodError nếu invalid -> nên bắt ở error middleware và trả 400.
 */
export function parseOrderDetails<T extends ServiceTypeKey>(
  serviceType: T,
  rawDetails: unknown,
): OrderDetailsByServiceType[T] {
  const schema = orderDetailsSchemaMap[serviceType];
  return schema.parse(rawDetails) as OrderDetailsByServiceType[T];
}
