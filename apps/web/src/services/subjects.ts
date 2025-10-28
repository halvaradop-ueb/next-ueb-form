import { supabase } from "@/lib/supabase/client"
import type { SubjectAssignmentService, SubjectAssignmentWithProfessorService, SubjectService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"

export const getSubjects = async (): Promise<SubjectService[]> => {
    const request = createRequest("GET", "subjects")
    const result = await createService(request)
    return result?.data || []
}

export const getSubjectsByProfessorId = async (professorId: string): Promise<SubjectService[]> => {
    const request = createRequest("GET", `subjects/${professorId}/professors`)
    const result = await createService(request)
    return result?.data || []
}

export const addAssignment = async (professorId: string, subjectId: string): Promise<SubjectAssignmentService[]> => {
    const request = createRequest("POST", "subjects/assignments", { professorId, subjectId })
    return createService(request)
}

export const getProfessorsBySubject = async (subjectId: string): Promise<SubjectAssignmentWithProfessorService[]> => {
    try {
        const { data, error } = await supabase
            .from("subjectassignment")
            .select(
                `
                id,
                subject_id,
                Subject: subject_id (
                    id,
                    name,
                    description,
                    semestre
                ),
                User: professor_id (
                    id,
                    first_name,
                    last_name,
                    email
                )
            `
            )
            .eq("subject_id", subjectId)
        if (error) {
            throw new Error(`Error fetching professors by subject ID: ${error.message}`)
        }
        return data.map((relation) => ({
            id: relation.id,
            subject_id: relation.subject_id,
            user: relation.User,
            subject: relation.Subject,
        })) as unknown as SubjectAssignmentWithProfessorService[]
    } catch (error) {
        console.error("Error fetching professors by subject ID:", error)
        return []
    }
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
    const result = await createService(request)
    return result?.data || result
}

export const deleteSubject = async (subjectId: string): Promise<boolean> => {
    const request = createRequest("DELETE", `subjects/${subjectId}`)
    const result = await createService(request)
    return result?.data || result || false
}

export const updateSubject = async (
    subjectId: string,
    updates: Partial<Omit<SubjectService, "id" | "professor_id">>
): Promise<SubjectService> => {
    const request = createRequest("PUT", `subjects/${subjectId}`, updates)
    const result = await createService(request)
    return result?.data || result
}
