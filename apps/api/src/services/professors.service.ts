import { getUsers } from "./users.service.js"

export async function getProfessors(): Promise<any[]> {
    try {
        const professors = await getUsers()
        return professors.filter((professor: any) => professor.role === "professor")
    } catch (error) {
        console.error("Error fetching professors:", error)
        return []
    }
}
