import { z } from "zod";

/**
 * Schema cho toàn bộ request body khi FE submit booking.
 * `details` ở đây vẫn là unknown - sẽ được parse kỹ hơn bằng
 * `parseOrderDetails()` (orderDetails.schema.ts) sau khi biết serviceType.
 */
export const createOrderRequestSchema = z.object({
  gameId: z.string().cuid(),
  serviceId: z.string().cuid(),
  details: z.record(z.string(), z.unknown()), // validate chi tiết ở bước sau theo serviceType
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.string().trim().email(),
});
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

/**
 * Schema khi booster/admin cập nhật tiến độ 1 order.
 * Tất cả field optional ngoại trừ orderId (lấy từ param) vì 1 lần update
 * có thể chỉ đổi note, hoặc chỉ đổi progressPct, hoặc cả status.
 */
export const updateOrderProgressSchema = z
  .object({
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ])
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
    { message: "Phải có ít nhất 1 field để update" },
  );
export type UpdateOrderProgressInput = z.infer<
  typeof updateOrderProgressSchema
>;

/** Admin gán booster cho order */
export const assignBoosterSchema = z.object({
  boosterId: z.string().cuid(),
});
export type AssignBoosterInput = z.infer<typeof assignBoosterSchema>;
