import { Question } from "@/lib/@types/services"

export const getQuestions = async (): Promise<Question[]> => {
    try {
        const res = await fetch("/api/questions")
        if (!res.ok) {
            console.error("No se pudieron cargar las preguntas")
            return []
        }
        const data = await res.json()
        return Array.isArray(data.questions) ? data.questions : []
    } catch (error) {
        console.error("Error en getQuestions:", error)
        return []
    }
}

export const addQuestion = async (question: Question): Promise<Question | null> => {
    try {
        const res = await fetch("/api/questions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
        })

        if (!res.ok) {
            console.error("No se pudo agregar la pregunta")
            return null
        }

        const data = await res.json()
        return data || null
    } catch (error) {
        console.error("Error en addQuestion:", error)
        return null
    }
}

export const updateQuestion = async (question: Question): Promise<Question | null> => {
    try {
        const res = await fetch("/api/questions", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
        })

        if (!res.ok) {
            console.error("No se pudo actualizar la pregunta")
            return null
        }

        const data = await res.json()
        return data || null
    } catch (error) {
        console.error("Error en updateQuestion:", error)
        return null
    }
}

export const deleteQuestion = async (id: string): Promise<boolean> => {
    try {
        const res = await fetch(`/api/questions?id=${id}`, {
            method: "DELETE",
        })

        if (!res.ok) {
            console.error("No se pudo eliminar la pregunta")
            return false
        }

        const data = await res.json()
        return data.success || false
    } catch (error) {
        console.error("Error en deleteQuestion:", error)
        return false
    }
}

export const getQuestionsForStudents = async (): Promise<[Question[], Partial<Record<string, Question[]>>]> => {
    try {
        const res = await fetch("/api/questions?audience=student")
        if (!res.ok) {
            console.error("No se pudieron cargar las preguntas para estudiantes")
            return [[], {}]
        }
        const data = await res.json()
        return [data.questions || [], data.grouped || {}]
    } catch (error) {
        console.error("Error en getQuestionsForStudents:", error)
        return [[], {}]
    }
}

export const getQuestionsForProfessors = async (): Promise<[Question[], Partial<Record<string, Question[]>>]> => {
    try {
        const res = await fetch("/api/questions?audience=professor")
        if (!res.ok) {
            console.error("No se pudieron cargar las preguntas para profesores")
            return [[], {}]
        }
        const data = await res.json()
        return [data.questions || [], data.grouped || {}]
    } catch (error) {
        console.error("Error en getQuestionsForProfessors:", error)
        return [[], {}]
    }
}
