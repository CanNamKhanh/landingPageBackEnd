import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./booster.controller";

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN));

router.post(
  "/",
  asyncHandler("createBooster", controller.createBoosterHandler),
);
router.get("/", asyncHandler("listBoosters", controller.listBoostersHandler));
router.patch(
  "/:boosterId",
  asyncHandler("updateBooster", controller.updateBoosterHandler),
);

export default router;
