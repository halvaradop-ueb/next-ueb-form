import { ProfessorFormState, StudentFormState } from "@/lib/@types/types"

export const addAnswer = async <FormSchema extends StudentFormState | ProfessorFormState>(
    answer: FormSchema,
    userId: string,
): Promise<boolean> => {
    try {
        const res = await fetch("/api/answers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ answer, userId }),
        })

        if (!res.ok) {
            console.error("No se pudo agregar la respuesta")
            return false
        }

        return true
    } catch (error) {
        console.error("Error en addAnswer:", error)
        return false
    }
}
