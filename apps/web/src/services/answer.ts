import { ProfessorFormState, StudentFormState } from "@/lib/@types/types"
import { createService, createRequest } from "./utils"

export const addAnswer = async <FormSchema extends StudentFormState | ProfessorFormState>(
    answer: FormSchema,
    userId: string
): Promise<boolean> => {
    try {
        const request = createRequest("POST", "answers", { answer, userId })
        const result = await createService(request)
        return !!result
    } catch (error) {
        console.error("Error en addAnswer:", error)
        return false
    }
}
