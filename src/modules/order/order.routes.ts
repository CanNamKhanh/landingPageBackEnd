import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRole } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as controller from "./order.controller";

const router = Router();

// USER (hoặc khách vãng lai) book kèo -> không cần login bắt buộc,
// nếu có login thì BE sẽ tự gắn userId (xem createOrderHandler)
router.post("/", asyncHandler("createOrder", controller.createOrderHandler));

// Webhook / FE gọi sau khi thanh toán xong -> bắt buộc login để tránh giả mạo
router.post(
  "/:orderId/confirm-payment",
  authenticate,
  asyncHandler("confirmPayment", controller.confirmPaymentHandler),
);

// List kèo - mọi role login đều gọi được, phân quyền chi tiết theo `scope` nằm trong service
router.get(
  "",
  authenticate,
  asyncHandler("listOrders", controller.listOrdersHandler),
);

router.get(
  "/:orderId",
  authenticate,
  asyncHandler("getOrder", controller.getOrderHandler),
);

// Booster claim kèo cho chính mình
router.post(
  "/:orderId/claim",
  authenticate,
  requireRole(Role.BOOSTER),
  asyncHandler("claimOrder", controller.claimOrderHandler),
);

// Admin chỉ định booster (không cho booster tự gọi route này)
router.post(
  "/:orderId/assign-booster",
  authenticate,
  requireRole(Role.ADMIN),
  asyncHandler("assignBooster", controller.assignBoosterHandler),
);

// Booster cập nhật tiến độ kèo của mình, admin cập nhật tiến độ kèo bất kỳ
router.patch(
  "/:orderId/progress",
  authenticate,
  requireRole(Role.BOOSTER, Role.ADMIN),
  asyncHandler("updateOrderProgress", controller.updateOrderProgressHandler),
);

export default router;
