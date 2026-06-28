import { Request, Response } from "express";
import {
  assignBoosterRequestSchema,
  confirmPaymentRequestSchema,
  createOrderRequestSchema,
  listOrdersQuerySchema,
  updateOrderProgressSchema,
} from "./order.requests.schema";
import * as orderService from "./order.service";
import { logger } from "../../utils/logger";

const log = logger.scope("OrderController");

export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  const body = createOrderRequestSchema.parse(req.body);
  // user có thể chưa login (khách vãng lai book kèo) -> userId nullable
  const userId = req.user?.id ?? null;

  const order = await orderService.createOrder(body, userId);
  log.info("order created", { orderId: order.id, code: order.code });
  res.status(201).json({ data: order });
}

export async function confirmPaymentHandler(req: Request, res: Response): Promise<void> {
  const body = confirmPaymentRequestSchema.parse(req.body);
  const order = await orderService.confirmPayment(req.params.orderId, body.paymentRef);
  res.status(200).json({ data: order });
}

export async function listOrdersHandler(req: Request, res: Response): Promise<void> {
  const query = listOrdersQuerySchema.parse(req.query);
  const orders = await orderService.listOrders(req.user!, query);
  res.status(200).json({ data: orders });
}

export async function getOrderHandler(req: Request, res: Response): Promise<void> {
  const order = await orderService.getOrderById(req.params.orderId, req.user!);
  res.status(200).json({ data: order });
}

/** Booster tự claim kèo */
export async function claimOrderHandler(req: Request, res: Response): Promise<void> {
  const order = await orderService.claimOrder(req.params.orderId, req.user!.id);
  log.info("order claimed", { orderId: order.id, boosterId: req.user!.id });
  res.status(200).json({ data: order });
}

/** Admin chỉ định booster qua dropdown */
export async function assignBoosterHandler(req: Request, res: Response): Promise<void> {
  const body = assignBoosterRequestSchema.parse(req.body);
  const order = await orderService.assignBooster(req.params.orderId, body.boosterId);
  log.info("booster assigned by admin", {
    orderId: order.id,
    boosterId: body.boosterId,
    adminId: req.user!.id,
  });
  res.status(200).json({ data: order });
}

export async function updateOrderProgressHandler(req: Request, res: Response): Promise<void> {
  const body = updateOrderProgressSchema.parse(req.body);
  const order = await orderService.updateOrderProgress(req.params.orderId, req.user!, body);
  res.status(200).json({ data: order });
}
