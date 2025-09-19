import { ProfessorFormState, StudentFormState } from "@/lib/@types/types"
import { createService, createRequest } from "./utils"

export const addAnswer = async <FormSchema extends StudentFormState | ProfessorFormState>(
    answer: FormSchema,
    userId: string
): Promise<boolean> => {
    // In production, use Next.js API routes
    if (process.env.NODE_ENV === "production") {
        try {
            const response = await fetch("/api/answers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ answer, userId }),
            })
            if (!response.ok) {
                throw new Error(`Error adding answers: ${response.statusText}`)
            }
            const json = await response.json()
            return !!json.data?.success
        } catch (error) {
            console.error("Error en addAnswer:", error)
            return false
        }
    }

    // In development, use the Express API
    try {
        const request = createRequest("POST", "answers", { answer, userId })
        const result = await createService(request)
        return !!result
    } catch (error) {
        console.error("Error en addAnswer:", error)
        return false
    }
}
