import { ProfessorService } from "@/lib/@types/services"
import { getUsers } from "./users"

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
