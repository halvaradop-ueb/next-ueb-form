import { NextRequest } from "next/server"
import { getSubjectsByProfessorId as getSubjectsByProfessorIdService } from "@/services/subjects"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const professorId = searchParams.get("professorId")

    if (!professorId) {
        return new Response(
            JSON.stringify({
                data: [],
                errors: "Professor ID is required",
                message: "Failed to retrieve subjects",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        )
    }

    try {
        const subjects = await getSubjectsByProfessorIdService(professorId)
        return new Response(
            JSON.stringify({
                data: subjects,
                errors: null,
                message: "Subjects retrieved successfully",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        )
    } catch (error) {
        console.error("Error fetching subjects by professor ID:", error)
        return new Response(
            JSON.stringify({
                data: [],
                errors: "Failed to retrieve subjects",
                message: "Failed to retrieve subjects",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
