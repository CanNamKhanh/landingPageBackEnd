import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { logger } from "../../utils/logger";
import { ValidationError, NotFoundError } from "../../utils/errors";
import {
  CreateBoosterRequest,
  ListBoostersQuery,
  UpdateBoosterRequest,
} from "./booster.requests.schema";
import { prisma } from "../../libs/prisma";

const log = logger.scope("BoosterService");
const SALT_ROUNDS = 10;

/**
 * NOTE: cần bổ sung 2 field vào model User trong schema.prisma:
 *   displayName String?  @map("display_name")
 *   isActive    Boolean  @default(true) @map("is_active")
 * (User hiện tại của bạn chưa có field này, dùng để admin tạo/disable booster mà
 * không cần xoá account - tránh vỡ FK với Order.boosterId, OrderProgressLog.updatedById)
 */

export async function createBooster(input: CreateBoosterRequest) {
  log.info("createBooster:start", {
    email: input.email,
    username: input.username,
  });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    throw new ValidationError("Email hoặc username đã được sử dụng");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const booster = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      role: Role.BOOSTER,
      displayName: input.displayName ?? null,
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  log.info("createBooster:success", { boosterId: booster.id });
  return booster;
}

/** Dùng để đổ vào dropdown "chỉ định booster" ở trang admin */
export async function listBoosters(query: ListBoostersQuery) {
  const boosters = await prisma.user.findMany({
    where: {
      role: Role.BOOSTER,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      isActive: true,
      createdAt: true,
      // đếm số kèo đang cày để admin biết booster nào đang rảnh
      _count: { select: { boostedOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  log.debug("listBoosters", { count: boosters.length });
  return boosters;
}

export async function updateBooster(
  boosterId: string,
  input: UpdateBoosterRequest,
) {
  const booster = await prisma.user.findUnique({ where: { id: boosterId } });
  if (!booster || booster.role !== Role.BOOSTER) {
    throw new NotFoundError("Booster không tồn tại");
  }

  const updated = await prisma.user.update({
    where: { id: boosterId },
    data: {
      ...(input.displayName !== undefined && {
        displayName: input.displayName,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      isActive: true,
    },
  });

  log.info("updateBooster:success", { boosterId, changes: input });
  return updated;
}
