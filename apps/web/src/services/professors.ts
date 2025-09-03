import { ProfessorService } from "@/lib/@types/services"
import { getUsers } from "./users"

export const getProfessors = async (): Promise<ProfessorService[]> => {
    try {
        const res = await fetch("/api/users?role=professor")
        if (!res.ok) {
            console.error("No se pudieron cargar los profesores")
            return []
        }
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error("Error en getProfessors:", error)
        return []
    }
}
