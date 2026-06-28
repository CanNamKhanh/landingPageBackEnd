import { z } from "zod";

export const createOrderRequestSchema = z.object({
  gameId: z.string().cuid(),
  serviceId: z.string().cuid(),
  details: z.record(z.string(), z.unknown()), // validate chi tiết ở orderDetails.schema.ts theo serviceType
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().trim().email(),
});
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

/** Body khi xác nhận đã thanh toán thành công (gọi từ webhook payment gateway hoặc FE sau khi PayPal/redirect về) */
export const confirmPaymentRequestSchema = z.object({
  paymentRef: z.string().trim().min(1), // mã giao dịch từ payment gateway, để audit
});
export type ConfirmPaymentRequest = z.infer<typeof confirmPaymentRequestSchema>;

export const updateOrderProgressSchema = z
  .object({
    status: z
      .enum(["IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"])
      .optional(),
    progressPct: z.number().int().min(0).max(100).optional(),
    note: z.string().trim().max(1000).optional(),
    proofUrls: z.array(z.string().url()).max(10).optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.progressPct !== undefined ||
      data.note !== undefined ||
      data.proofUrls !== undefined,
    { message: "Phải có ít nhất 1 field để update" }
  );
export type UpdateOrderProgressInput = z.infer<typeof updateOrderProgressSchema>;

/** Admin chỉ định booster cho 1 kèo (dropdown ở trang admin) */
export const assignBoosterRequestSchema = z.object({
  boosterId: z.string().cuid(),
});
export type AssignBoosterRequest = z.infer<typeof assignBoosterRequestSchema>;

/** Query filter khi list orders, tuỳ theo role mà FE sẽ gửi scope khác nhau */
export const listOrdersQuerySchema = z.object({
  scope: z.enum(["all", "mine", "claimable", "assignedToMe"]).default("all"),
  status: z
    .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"])
    .optional(),
  gameId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
