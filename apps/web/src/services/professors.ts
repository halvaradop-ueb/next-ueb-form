import { ProfessorService, SubjectService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"
import { getUsers } from "./users"
import type { PeerReview } from "@ueb/types"

export const getProfessors = async (): Promise<ProfessorService[]> => {
    try {
        const users = await getUsers()
        const professors = users.filter((user) => user.role === "professor")
        return professors as ProfessorService[]
    } catch (error) {
        console.error("Error en getProfessors:", error)
        return []
    }
}

export const getSubjectsByProfessorId = async (professorId: string): Promise<SubjectService[]> => {
    const request = createRequest("GET", `professors/${professorId}/subjects`)
    return createService(request)
}

export const addCoevaluation = async (peerReview: PeerReview, admin: string) => {
    if (!admin) return
    const request = createRequest("POST", `professors/${peerReview.professor}/co_evaluation`, { ...peerReview, admin })
    return await createService(request)
}

export const getAllCoevaluations = async (professorId?: string, subjectId?: string) => {
    const params = new URLSearchParams()
    if (professorId) params.append("professorId", professorId)
    if (subjectId) params.append("subjectId", subjectId)

    const url = `co_evaluations${params.toString() ? `?${params.toString()}` : ""}`
    const request = createRequest("GET", url)
    return await createService(request)
}

export const updateCoevaluation = async (professorId: string, reviewId: string, peerReview: Partial<PeerReview>) => {
    const request = createRequest("POST", `professors/${professorId}/co_evaluation/${reviewId}`, peerReview)
    return await createService(request)
}

export const deleteCoevaluation = async (professorId: string, reviewId: string) => {
    const request = createRequest("DELETE", `professors/${professorId}/co_evaluation/${reviewId}`)
    return await createService(request)
}
