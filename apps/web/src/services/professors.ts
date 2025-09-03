import { ProfessorService } from "@/lib/@types/services"
import { getUsers } from "./users"

// services/professors.ts
export const getProfessors = async () => {
    try {
        const res = await fetch("/api/users?role=professor")
        if (!res.ok) throw new Error("No se pudieron cargar los profesores")
        const data = await res.json()
        // Asegurarse de que siempre devuelva un array
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error("Error en getProfessors:", error)
        return []
    }
}
