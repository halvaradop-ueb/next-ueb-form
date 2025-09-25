import { createService, createRequest } from "./utils"
import type { AutoEvaluationBySemester } from "@/lib/@types/services"

export interface AutoEvaluationAnswer {
    id: string
    answer_id: string
    answer_text: string
    professor_id: string
    subject_id: string
    semester: string
}

export const getAutoEvaluationAnswers = async (professorId: string, subjectId: string): Promise<AutoEvaluationBySemester[]> => {
    try {
        const request = createRequest("GET", `auto-evaluation?professorId=${professorId}&subjectId=${subjectId}`)
        const result = await createService(request)
        return result || []
    } catch (error) {
        console.error("Error fetching autoevaluation answers:", error)
        return []
    }
}

export const getAutoEvaluationAnswersByProfessor = async (professorId: string): Promise<AutoEvaluationBySemester[]> => {
    try {
        const request = createRequest("GET", `auto-evaluation/professor/${professorId}`)
        const result = await createService(request)
        return result || []
    } catch (error) {
        console.error("Error fetching autoevaluation answers for professor:", error)
        return []
    }
}
