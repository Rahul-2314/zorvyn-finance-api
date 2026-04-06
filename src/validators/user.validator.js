import {z} from "zod";

export const roleValidatorSchema = z.object({
    role: z.enum(["viewer", "analyst", "admin"]),
});

export const statusValidatorSchema = z.object({
    active: z.boolean(),
})