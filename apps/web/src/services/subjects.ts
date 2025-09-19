import { supabase } from "@/lib/supabase/client"
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
    try {
        const { data: relation, error: checkError } = await supabase
            .from("subjectassignment")
            .select("*")
            .eq("professor_id", professorId)
            .eq("subject_id", subjectId)
            .maybeSingle()
        if (relation) {
            return relation
        }
        const { data, error } = await supabase
            .from("subjectassignment")
            .insert({ professor_id: professorId, subject_id: subjectId })
            .select()

        if (error) {
            throw new Error(`Error adding assignment: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error adding assignment:", error)
        return []
    }
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
                    name
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
    try {
        const { error } = await supabase.from("subjectassignment").delete().eq("id", assignmentId)
        if (error) {
            throw new Error(`Error deleting assignment: ${error.message}`)
        }
        return true
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
    return createService(request)
}
