import { z } from "zod"

export const selectSubjectStepSchema = z.object({
    professor: z.string().min(1, "Selecciona un docente"),
    subject: z.string().min(1, "Selecciona una materia"),
})
