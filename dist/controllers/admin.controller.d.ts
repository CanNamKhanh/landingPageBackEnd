import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
export declare const getAllUsers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUserDetail: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getUserConversations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAllUsersWithConversations: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map