import type { SubjectAssignmentService, SubjectAssignmentWithProfessorService, SubjectService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"

export const getSubjects = async (): Promise<SubjectService[]> => {
    const request = createRequest("GET", "subjects")
    const result = await createService(request)
    return result || []
}

export const getSubjectsByProfessorId = async (professorId: string): Promise<SubjectService[]> => {
    const request = createRequest("GET", `subjects/${professorId}/professors`)
    return createService(request)
}

export const addAssignment = async (professorId: string, subjectId: string): Promise<SubjectAssignmentService[]> => {
    const request = createRequest("POST", "subjects/assignments", { professorId, subjectId })
    return createService(request)
}

export const getProfessorsBySubject = async (subjectId: string): Promise<SubjectAssignmentWithProfessorService[]> => {
    const request = createRequest("GET", `subjects/${subjectId}/assignments`)
    return createService(request)
}

export const deleteAssignment = async (assignmentId: string): Promise<boolean> => {
    const request = createRequest("DELETE", `subjects/assignments/${assignmentId}`)
    try {
        const result = await createService(request)
        return result === true
    } catch (error) {
        console.error("Error deleting assignment:", error)
        return false
    }
}

export const addSubject = async (subject: Omit<SubjectService, "id" | "professor_id">): Promise<SubjectService> => {
    const request = createRequest("POST", "subjects", subject)
    return createService(request)
}

export const deleteSubject = async (subjectId: string): Promise<boolean> => {
    const request = createRequest("DELETE", `subjects/${subjectId}`)
    try {
        const result = await createService(request)
        return result === true
    } catch (error) {
        console.error("Error deleting subject:", error)
        return false
    }
}
