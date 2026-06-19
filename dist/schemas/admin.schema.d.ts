import * as z from "zod";
export declare const getAllUsersSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type GetAllUsersInput = z.infer<typeof getAllUsersSchema>;
//# sourceMappingURL=admin.schema.d.ts.map