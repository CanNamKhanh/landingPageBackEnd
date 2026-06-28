import { NextFunction, Request, Response } from "express";
import { logger } from "./logger";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Bọc controller async, tự catch lỗi đẩy qua errorHandler middleware,
 * đồng thời log request vào/ra để debug nhanh (method, path, status, duration).
 */
export function asyncHandler(routeName: string, handler: Handler) {
  const log = logger.scope(`Route:${routeName}`);

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    log.debug("incoming", { method: req.method, path: req.originalUrl });

    handler(req, res, next)
      .then(() => {
        log.debug("done", {
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          ms: Date.now() - start,
        });
      })
      .catch((error: unknown) => {
        log.error("error", {
          method: req.method,
          path: req.originalUrl,
          error: error instanceof Error ? error.message : error,
        });
        next(error);
      });
  };
}
