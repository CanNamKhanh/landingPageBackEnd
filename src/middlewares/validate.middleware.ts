import { NextFunction, Request, Response } from "express";
import * as z from "zod";

export const validate = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const isGet = req.method === "GET" || req.method === "DELETE";
    const data = isGet ? req.query : req.body;

    const result = await schema.safeParseAsync(data);

    if (!result.success) {
      return res.status(400).json({
        message: "Validate failed",
        error: result.error.issues,
      });
    }

    if (isGet) {
      const parsed = result.data as Record<string, unknown>;
      for (const key of Object.keys(parsed)) {
        (req.query as Record<string, unknown>)[key] = parsed[key];
      }
    } else {
      req.body = result.data;
    }

    next();
  };
};
