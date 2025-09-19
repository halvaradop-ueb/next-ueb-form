import { ProfessorService, SubjectService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"

export const getProfessors = async (): Promise<ProfessorService[]> => {
    try {
        // Get all users and filter for professors
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
