import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=requireAdmin.middleware.d.ts.map