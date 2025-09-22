import { createService, createRequest } from "./utils"
import type { AutoEvaluationAnswer, AutoEvaluationBySemester } from "@/lib/@types/services"

export const getAutoEvaluationAnswers = async (professorId: string, subjectId: string): Promise<AutoEvaluationBySemester[]> => {
    try {
        const request = createRequest("GET", `auto-evaluation?professorId=${professorId}&subjectId=${subjectId}`)
        const response = await createService(request)
        return response?.data || []
    } catch (error) {
        console.error("Error fetching autoevaluation answers:", error)
        return []
    }
}

export const getAutoEvaluationAnswersByProfessor = async (professorId: string): Promise<AutoEvaluationBySemester[]> => {
    try {
        const request = createRequest("GET", `auto-evaluation/professor/${professorId}`)
        const response = await createService(request)
        return response?.data || []
    } catch (error) {
        console.error("Error fetching autoevaluation answers for professor:", error)
        return []
    }
}
