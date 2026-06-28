import { Request, Response } from "express";
import {
  createBoosterRequestSchema,
  listBoostersQuerySchema,
  updateBoosterRequestSchema,
} from "./booster.requests.schema";
import * as boosterService from "./booster.service";
import { logger } from "../../utils/logger";

const log = logger.scope("BoosterController");

export async function createBoosterHandler(req: Request, res: Response): Promise<void> {
  const body = createBoosterRequestSchema.parse(req.body);
  const booster = await boosterService.createBooster(body);
  log.info("booster created by admin", { boosterId: booster.id, adminId: req.user!.id });
  res.status(201).json({ data: booster });
}

export async function listBoostersHandler(req: Request, res: Response): Promise<void> {
  const query = listBoostersQuerySchema.parse(req.query);
  const boosters = await boosterService.listBoosters(query);
  res.status(200).json({ data: boosters });
}

export async function updateBoosterHandler(req: Request, res: Response): Promise<void> {
  const body = updateBoosterRequestSchema.parse(req.body);
  const booster = await boosterService.updateBooster(req.params.boosterId, body);
  log.info("booster updated by admin", { boosterId: booster.id, adminId: req.user!.id });
  res.status(200).json({ data: booster });
}
