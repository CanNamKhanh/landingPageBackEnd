import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const rankBoostingDetailsSchema = z.object({
  server: nonEmptyString.optional(),
  currentRank: nonEmptyString,
  desiredRank: nonEmptyString,
});
export type RankBoostingDetails = z.infer<typeof rankBoostingDetailsSchema>;

export const placementMatchesDetailsSchema = z.object({
  server: nonEmptyString,
  numberOfMatches: z.number().int().min(1).max(20),
  previousSeasonRank: nonEmptyString,
});
export type PlacementMatchesDetails = z.infer<typeof placementMatchesDetailsSchema>;

export const netWinsDetailsSchema = z.object({
  server: nonEmptyString,
  numberOfMatches: z.number().int().min(1).max(50),
  currentRank: nonEmptyString,
});
export type NetWinsDetails = z.infer<typeof netWinsDetailsSchema>;

export const farmingDetailsSchema = z.object({
  amount: z.number().int().positive(),
});
export type FarmingDetails = z.infer<typeof farmingDetailsSchema>;

export const accountLevelingDetailsSchema = z.union([
  z.object({
    currentLevel: z.number().int().min(1),
    targetLevel: z.number().int().min(1),
  }),
  z.object({
    levelRanges: z.array(nonEmptyString).min(1),
  }),
]);
export type AccountLevelingDetails = z.infer<typeof accountLevelingDetailsSchema>;

export const raidHazardDetailsSchema = z.object({
  map: nonEmptyString,
  difficulty: nonEmptyString,
  quantity: z.number().int().min(1).max(100),
});
export type RaidHazardDetails = z.infer<typeof raidHazardDetailsSchema>;

export const titaniumCaseDetailsSchema = z.object({
  missionsToComplete: z.number().int().min(1).max(60),
});
export type TitaniumCaseDetails = z.infer<typeof titaniumCaseDetailsSchema>;

export const seasonMissionDetailsSchema = z.object({
  packageCode: z.literal("SAFEBOX_FULL").default("SAFEBOX_FULL"),
});
export type SeasonMissionDetails = z.infer<typeof seasonMissionDetailsSchema>;

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

export function parseOrderDetails<T extends ServiceTypeKey>(
  serviceType: T,
  rawDetails: unknown
): OrderDetailsByServiceType[T] {
  const schema = orderDetailsSchemaMap[serviceType];
  return schema.parse(rawDetails) as OrderDetailsByServiceType[T];
}
