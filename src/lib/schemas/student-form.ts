import { z } from "zod"

export const StudentFormSchema = z.object({
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
