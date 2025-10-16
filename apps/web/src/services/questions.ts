import type { Question } from "@/lib/@types/services"
import { API_ENDPOINT } from "./utils"

export const getQuestions = async (): Promise<Question[]> => {
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
        const response = await fetch(`${API_ENDPOINT}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(question),
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

// Helper function to get question title by ID
export const getQuestionTitleById = async (questionId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/questions?id=${questionId}`)
        if (!response.ok) {
            throw new Error(`Error fetching question title: ${response.statusText}`)
        }
        const data = await response.json()
        const question = Array.isArray(data.questions) ? data.questions[0] : data
        return question?.title || null
    } catch (error) {
        console.error("Error fetching question title by ID:", error)
        return null
    }
}

export const getQuestionTitleByAnswerId = async (answerValueId: string): Promise<string | null> => {
    try {
        return null
    } catch (error) {
        console.error("❌ [DEBUG] Error in deprecated getQuestionTitleByAnswerId:", error)
        return null
    }
}

export const getQuestionsBySubject = async (subjectId: string): Promise<Question[]> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/questions?subject=${subjectId}`)
        if (!response.ok) {
            throw new Error(`Error fetching questions for subject: ${response.statusText}`)
        }
        const data = await response.json()
        return Array.isArray(data.questions) ? data.questions : []
    } catch (error) {
        console.error("❌ [FRONTEND] Error en getQuestionsBySubject:", error)
        return []
    }
}
