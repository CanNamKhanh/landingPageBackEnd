type LogMeta = Record<string, unknown> | undefined;

function format(level: string, context: string, msg: string, meta: LogMeta): string {
  const time = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${time}] [${level}] [${context}] ${msg}${metaStr}`;
}

/**
 * logger.scope("OrderService") trả về 1 logger con đã gắn sẵn context,
 * để khỏi phải lặp lại tên module mỗi lần log.
 *
 * Ví dụ:
 *   const log = logger.scope("OrderService.createOrder");
 *   log.info("start", { userId });
 *   log.error("failed to create order", { error });
 */
export const logger = {
  info(context: string, msg: string, meta?: LogMeta): void {
    console.log(format("INFO", context, msg, meta));
  },
  warn(context: string, msg: string, meta?: LogMeta): void {
    console.warn(format("WARN", context, msg, meta));
  },
  error(context: string, msg: string, meta?: LogMeta): void {
    console.error(format("ERROR", context, msg, meta));
  },
  debug(context: string, msg: string, meta?: LogMeta): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(format("DEBUG", context, msg, meta));
    }
  },
  scope(context: string) {
    return {
      info: (msg: string, meta?: LogMeta) => logger.info(context, msg, meta),
      warn: (msg: string, meta?: LogMeta) => logger.warn(context, msg, meta),
      error: (msg: string, meta?: LogMeta) => logger.error(context, msg, meta),
      debug: (msg: string, meta?: LogMeta) => logger.debug(context, msg, meta),
    };
  },
};
