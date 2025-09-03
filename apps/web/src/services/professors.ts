import { ProfessorService } from "@/lib/@types/services"
import { getUsers } from "./users"

/**
 * @experimental
 */
const ROUTE = "http://localhost:4000/api/v1"

export const getProfessors = async (): Promise<ProfessorService[]> => {
    try {
        const response = await fetch(`${ROUTE}/users?role=professor`)
        if (!response.ok) {
            return []
        }
        const json = await response.json()
        return json.data
    } catch (error) {
        console.error("Error fetching professors:", error)
        return []
    }
}
