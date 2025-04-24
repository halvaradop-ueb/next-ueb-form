import { z } from "zod";

export const LoginSchema = z
    .object({
        email: z.string().email("Invalid email address").min(1, "Email is required"),
        password: z.string().min(1, "Password is required"),
    })
    .refine((data) => data.email !== data.password, {
        message: "Email and password cannot be the same",
    });
