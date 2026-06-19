import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "./auth.middleware";
export declare const asyncHandler: (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>) => RequestHandler;
//# sourceMappingURL=asyncHandler.middleware.d.ts.map