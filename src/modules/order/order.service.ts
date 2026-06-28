import { logger } from "../../utils/logger";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors";
import {
  CreateOrderRequest,
  ListOrdersQuery,
  UpdateOrderProgressInput,
} from "./order.requests.schema";
import { parseOrderDetails, ServiceTypeKey } from "./orderDetails.schema";
import { prisma } from "../../libs/prisma";
import { OrderStatus, Prisma, Role } from "@prisma/client";

const log = logger.scope("OrderService");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function generateOrderCode(
  gameCode: string,
  serviceType: string,
): Promise<string> {
  const count = await prisma.order.count();
  const gamePrefix = gameCode.slice(0, 3).toUpperCase();
  const servicePrefix = serviceType.slice(0, 2).toUpperCase();
  const seq = String(count + 1).padStart(5, "0");
  return `${gamePrefix}-${servicePrefix}-${seq}`;
}

/**
 * Tính giá dựa vào config của GameService. Đây là nơi DUY NHẤT tính tiền,
 * không tin tưởng giá trị FE gửi lên.
 * TODO: thay logic này bằng bảng giá thật (theo rank pair, theo level range, theo map/difficulty...)
 */
function calculatePrice(config: Prisma.JsonValue, details: unknown): number {
  const cfg = config as { basePrice?: number; pricePerUnit?: number };
  const basePrice = cfg.basePrice ?? 0;

  if (
    typeof details === "object" &&
    details !== null &&
    "quantity" in details
  ) {
    const quantity = (details as { quantity: number }).quantity;
    return basePrice + (cfg.pricePerUnit ?? 0) * quantity;
  }

  return basePrice;
}

// ---------------------------------------------------------------------------
// USER: book kèo
// ---------------------------------------------------------------------------

/**
 * User submit booking -> tạo Order status PENDING (chưa thanh toán).
 * Sau khi thanh toán thành công, gọi confirmPayment() để chuyển sang CONFIRMED
 * (lúc đó kèo mới "thực sự" nằm trong pool cho booster claim).
 */
export async function createOrder(
  input: CreateOrderRequest,
  userId: string | null,
) {
  log.info("createOrder:start", { userId, serviceId: input.serviceId });

  const service = await prisma.gameService.findUnique({
    where: { id: input.serviceId },
    include: { game: true },
  });

  if (!service || !service.isActive) {
    throw new ValidationError("Service không tồn tại hoặc đã ngừng hoạt động");
  }
  if (service.gameId !== input.gameId) {
    throw new ValidationError("gameId không khớp với serviceId");
  }

  const validatedDetails = parseOrderDetails(
    service.type as ServiceTypeKey,
    input.details,
  );
  const totalPrice = calculatePrice(service.config, validatedDetails);
  const code = await generateOrderCode(service.game.code, service.type);

  const order = await prisma.order.create({
    data: {
      code,
      gameId: input.gameId,
      serviceId: input.serviceId,
      details: validatedDetails as Prisma.InputJsonValue,
      totalPrice,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      userId,
      status: OrderStatus.PENDING,
    },
  });

  log.info("createOrder:success", { orderId: order.id, code: order.code });
  return order;
}

/**
 * Xác nhận thanh toán thành công -> đẩy order vào pool cho booster (status CONFIRMED).
 * Gọi từ payment webhook hoặc FE sau khi redirect về từ cổng thanh toán.
 */
export async function confirmPayment(orderId: string, paymentRef: string) {
  log.info("confirmPayment:start", { orderId, paymentRef });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order không tồn tại");

  if (order.status !== OrderStatus.PENDING) {
    throw new ValidationError(
      `Order đang ở status ${order.status}, không thể confirm payment`,
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CONFIRMED, paymentRef },
  });

  log.info("confirmPayment:success", { orderId, newStatus: updated.status });
  return updated;
}

// ---------------------------------------------------------------------------
// LIST - dùng chung cho USER / BOOSTER / ADMIN, khác nhau ở `scope`
// ---------------------------------------------------------------------------

export async function listOrders(
  actor: { id: string; role: Role },
  query: ListOrdersQuery,
) {
  const where: Prisma.OrderWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.gameId) where.gameId = query.gameId;

  switch (query.scope) {
    case "mine":
      // user xem các kèo họ đã book
      where.userId = actor.id;
      break;

    case "claimable":
      // booster xem các kèo đã thanh toán, chưa ai claim
      if (actor.role !== Role.BOOSTER) {
        throw new ForbiddenError(
          "Chỉ booster mới xem được danh sách kèo có thể claim",
        );
      }
      where.status = OrderStatus.CONFIRMED;
      where.boosterId = null;
      break;

    case "assignedToMe":
      // booster xem các kèo đang cày (tự claim hoặc admin assign)
      if (actor.role !== Role.BOOSTER) {
        throw new ForbiddenError("Chỉ booster mới có danh sách kèo được giao");
      }
      where.boosterId = actor.id;
      break;

    case "all":
    default:
      // chỉ admin được xem toàn bộ kèo của hệ thống
      if (actor.role !== Role.ADMIN) {
        throw new ForbiddenError(
          "Chỉ admin mới xem được toàn bộ danh sách kèo",
        );
      }
      break;
  }

  const orders = await prisma.order.findMany({
    where,
    take: query.limit,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      game: true,
      service: true,
      booster: { select: { id: true, username: true, email: true } },
    },
  });

  log.debug("listOrders", {
    actorId: actor.id,
    scope: query.scope,
    count: orders.length,
  });
  return orders;
}

export async function getOrderById(
  orderId: string,
  actor: { id: string; role: Role },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      game: true,
      service: true,
      booster: { select: { id: true, username: true, email: true } },
      progressLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) throw new NotFoundError("Order không tồn tại");

  const isOwner = order.userId === actor.id;
  const isAssignedBooster = order.boosterId === actor.id;
  const isAdmin = actor.role === Role.ADMIN;

  if (!isOwner && !isAssignedBooster && !isAdmin) {
    throw new ForbiddenError();
  }

  return order;
}

// ---------------------------------------------------------------------------
// BOOSTER: claim kèo (atomic, chống race condition khi 2 booster claim cùng lúc)
// ---------------------------------------------------------------------------

export async function claimOrder(orderId: string, boosterId: string) {
  log.info("claimOrder:start", { orderId, boosterId });

  // Update có điều kiện boosterId: null ngay trong WHERE -> chỉ 1 request thắng.
  // updateMany trả về count, nếu count === 0 nghĩa là đã có người claim trước (hoặc order không tồn tại/không hợp lệ).
  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      boosterId: null,
      status: OrderStatus.CONFIRMED,
    },
    data: {
      boosterId,
      status: OrderStatus.IN_PROGRESS,
    },
  });

  if (result.count === 0) {
    log.warn("claimOrder:conflict", { orderId, boosterId });

    // phân biệt rõ lý do để trả message hữu ích hơn cho FE
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError("Order không tồn tại");
    if (order.boosterId)
      throw new ConflictError("Kèo này đã có booster khác claim mất rồi");
    throw new ValidationError(
      `Order đang ở status ${order.status}, không thể claim`,
    );
  }

  log.info("claimOrder:success", { orderId, boosterId });
  return prisma.order.findUniqueOrThrow({ where: { id: orderId } });
}

// ---------------------------------------------------------------------------
// ADMIN: chỉ định booster (dropdown ở trang admin) - không qua cơ chế claim
// ---------------------------------------------------------------------------

export async function assignBooster(orderId: string, boosterId: string) {
  log.info("assignBooster:start", { orderId, boosterId });

  const booster = await prisma.user.findUnique({ where: { id: boosterId } });
  if (!booster || booster.role !== Role.BOOSTER) {
    throw new ValidationError(
      "boosterId không hợp lệ hoặc không phải role BOOSTER",
    );
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order không tồn tại");

  // Admin có quyền re-assign cả khi order đã có booster khác (vd booster cũ nghỉ)
  // -> KHÔNG cần check boosterId: null như claimOrder, vì đây là hành động chủ động của admin.
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      boosterId,
      status:
        order.status === OrderStatus.CONFIRMED
          ? OrderStatus.IN_PROGRESS
          : order.status,
    },
  });

  log.info("assignBooster:success", { orderId, boosterId });
  return updated;
}

// ---------------------------------------------------------------------------
// BOOSTER / ADMIN: cập nhật tiến độ
// ---------------------------------------------------------------------------

export async function updateOrderProgress(
  orderId: string,
  actor: { id: string; role: Role },
  input: UpdateOrderProgressInput,
) {
  log.info("updateOrderProgress:start", { orderId, actorId: actor.id, input });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order không tồn tại");

  const isAdmin = actor.role === Role.ADMIN;
  const isAssignedBooster =
    actor.role === Role.BOOSTER && order.boosterId === actor.id;

  if (!isAdmin && !isAssignedBooster) {
    throw new ForbiddenError("Bạn không có quyền cập nhật order này");
  }

  const [, updatedOrder] = await prisma.$transaction([
    prisma.orderProgressLog.create({
      data: {
        orderId,
        updatedById: actor.id,
        ...(input.status !== undefined && { status: input.status }),
        ...(input.progressPct !== undefined && {
          progressPct: input.progressPct,
        }),
        ...(input.note !== undefined && { note: input.note ?? null }),
        ...(input.proofUrls !== undefined && {
          proofUrls: input.proofUrls as Prisma.InputJsonValue,
        }),
      },
    }),

    prisma.order.update({
      where: { id: orderId },
      data: {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.progressPct !== undefined && {
          progressPct: input.progressPct,
        }),
      },
    }),
  ]);

  log.info("updateOrderProgress:success", {
    orderId,
    newStatus: updatedOrder.status,
  });
  return updatedOrder;
}
