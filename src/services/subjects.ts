import { supabase } from "@/lib/supabase/client"
import { SubjectService } from "@/lib/@types/services"

export const getSubjects = async (): Promise<SubjectService[]> => {
    try {
        const { data, error } = await supabase.from("subject").select("*")
        if (error) {
            throw new Error(`Error fetching subjects: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error fetching subjects:", error)
        return []
    }
}

export const getSubjectsByProfessorId = async (professorId: string): Promise<SubjectService[]> => {
    try {
        const subjects = await getSubjects()
        return subjects.filter((subject) => subject.professor_id === professorId)
    } catch (error) {
        console.error("Error fetching subjects by professor ID:", error)
        return []
    }
}
