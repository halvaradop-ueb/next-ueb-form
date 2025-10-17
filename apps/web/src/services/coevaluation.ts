import { createService, createRequest } from "./utils"

export interface CoevaluationData {
    id: string
    professor_id: string
    subject_id: string
    admin_id: string
    findings: string
    improvement_plan: string
    created_at: string
    subject?: {
        id: string
        name: string
        description?: string
    }
    professor?: {
        id: string
        first_name: string
        last_name: string
        email: string
    }
    admin?: {
        id: string
        first_name: string
        last_name: string
        email: string
    }
}

export const getAllCoevaluations = async (professorId?: string, subjectId?: string): Promise<CoevaluationData[]> => {
    try {
        const params = new URLSearchParams()
        if (professorId) params.append("professorId", professorId)
        if (subjectId) params.append("subjectId", subjectId)

        const url = `co_evaluations${params.toString() ? `?${params.toString()}` : ""}`
        const request = createRequest("GET", url)
        const result = await createService(request)
        return result || []
    } catch (error) {
        console.error("❌ [FRONTEND] Error fetching coevaluations:", error)
        return []
    }
}

export const getCoevaluationsByProfessor = async (professorId: string): Promise<CoevaluationData[]> => {
    try {
        const request = createRequest("GET", `co_evaluations?professorId=${professorId}`)
        const result = await createService(request)

        return result || []
    } catch (error) {
        console.error("❌ [FRONTEND] Error fetching coevaluations by professor:", error)
        return []
    }
}

export const getCoevaluationsBySubject = async (subjectId: string): Promise<CoevaluationData[]> => {
    try {
        const request = createRequest("GET", `co_evaluations?subjectId=${subjectId}`)
        const result = await createService(request)

        return result || []
    } catch (error) {
        console.error("❌ [FRONTEND] Error fetching coevaluations by subject:", error)
        return []
    }
}
