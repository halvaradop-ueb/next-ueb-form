import type { Question } from "@/lib/@types/services"
import { API_ENDPOINT } from "./utils"

export const getQuestions = async (): Promise<Question[]> => {
    // In production, use Next.js API routes
    if (process.env.NODE_ENV === "production") {
        try {
            const response = await fetch("/api/questions")
            if (!response.ok) {
                throw new Error(`Error fetching questions: ${response.statusText}`)
            }
            const json = await response.json()
            return Array.isArray(json.questions) ? json.questions : []
        } catch (error) {
            console.error("Error en getQuestions:", error)
            return []
        }
    }

    // In development, use the Express API
    try {
        const response = await fetch(`${API_ENDPOINT}/questions`)
        if (!response.ok) {
            throw new Error(`Error fetching questions: ${response.statusText}`)
        }
        const json = await response.json()
        return Array.isArray(json.questions) ? json.questions : []
    } catch (error) {
        console.error("Error en getQuestions:", error)
        return []
    }
}

export const addQuestion = async (question: Question): Promise<Question | null> => {
    try {
        // Remove the id field when creating a new question
        const { id, ...questionWithoutId } = question
        const response = await fetch(`${API_ENDPOINT}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(questionWithoutId),
        })

        if (!response.ok) {
            throw new Error(`Error adding question: ${response.statusText}`)
        }

        const data = await response.json()
        return data || null
    } catch (error) {
        console.error("Error en addQuestion:", error)
        return null
    }
}

export const updateQuestion = async (question: Question): Promise<Question | null> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/questions`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
        })

        if (!response.ok) {
            throw new Error(`Error updating question: ${response.statusText}`)
        }

        const data = await response.json()
        return data || null
    } catch (error) {
        console.error("Error en updateQuestion:", error)
        return null
    }
}

export const deleteQuestion = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/questions?id=${id}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            throw new Error(`Error deleting question: ${response.statusText}`)
        }

        const data = await response.json()
        return data.success || false
    } catch (error) {
        console.error("Error en deleteQuestion:", error)
        return false
    }
}

export const getQuestionsForStudents = async (): Promise<[Question[], Partial<Record<string, Question[]>>]> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/questions?audience=student`)
        if (!response.ok) {
            throw new Error(`Error fetching questions for students: ${response.statusText}`)
        }
        const data = await response.json()
        return [data.questions || [], data.grouped || {}]
    } catch (error) {
        console.error("Error en getQuestionsForStudents:", error)
        return [[], {}]
    }
}

export const getQuestionsForProfessors = async (): Promise<[Question[], Partial<Record<string, Question[]>>]> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/questions?audience=professor`)
        if (!response.ok) {
            throw new Error(`Error fetching questions for professors: ${response.statusText}`)
        }
        const data = await response.json()
        return [data.questions || [], data.grouped || {}]
    } catch (error) {
        console.error("Error en getQuestionsForProfessors:", error)
        return [[], {}]
    }
}
