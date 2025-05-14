import { z } from "zod"

export const LoginSchema = z
    .object({
        email: z.string().email("Invalid email address").min(1, "Email is required"),
        password: z.string().min(1, "Password is required"),
    })
    .refine((data) => data.email !== data.password, {
        message: "Email and password cannot be the same",
    })

export const AssignedStudentSchema = z.object({
    professor: z
        .string({
            errorMap: () => ({ message: "Selecciona un docente" }),
        })
        .min(1, "Selecciona un docente"),
    subject: z.string().min(1, "Selecciona una materia"),
})

export const FeedbackFormSchema = z.object({
    rating: z.number().min(1, "Selecciona una calificación entre 1 y 10").max(10, "Selecciona una calificación entre 1 y 10"),
    comment: z.string().optional(),
})

export const AssignedProfessorSchema = z.object({
    subject: z
        .string({
            errorMap: () => ({ message: "Selecciona una materia" }),
        })
        .min(1, "Selecciona una materia"),
})
