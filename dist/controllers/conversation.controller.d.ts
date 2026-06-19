import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
export declare const getMyConversations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAiMessages: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendMessageToAi: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAdminMessages: (req: AuthRequest, res: Response) => Promise<void>;
export declare const sendMessageToAdmin: (req: AuthRequest, res: Response) => Promise<void>;
export declare const adminGetAllConversations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const adminGetUserMessages: (req: AuthRequest, res: Response) => Promise<void>;
export declare const adminReply: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=conversation.controller.d.ts.map