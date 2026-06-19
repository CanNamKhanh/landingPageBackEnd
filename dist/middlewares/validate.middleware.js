"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => {
    return async (req, res, next) => {
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
            const parsed = result.data;
            for (const key of Object.keys(parsed)) {
                req.query[key] = parsed[key];
            }
        }
        else {
            req.body = result.data;
        }
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.middleware.js.map