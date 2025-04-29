import { ProffessorService } from "@/lib/@types/services"
import { getUsers } from "./users"

export const getProfessors = async (): Promise<ProffessorService[]> => {
    try {
        const professors = await getUsers()
        return professors.filter((professor) => professor.role === "professor")
    } catch (error) {
        console.error("Error fetching professors:", error)
        return []
    }
}
