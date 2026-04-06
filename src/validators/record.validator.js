import {z} from "zod";

export const recordValidatorSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(["income", "expense"]),
    category: z.string().min(1).max(80),
    date: z.string().refine((v) => !isNaN(Date.parse(v)), {
        message: "Invalid date string"
    }),
    notes: z.string().max(500).optional(),
});

export const recordSchema = recordValidatorSchema;
export const recordUpdateSchema = recordValidatorSchema.partial();