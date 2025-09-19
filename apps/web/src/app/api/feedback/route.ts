import { NextRequest } from "next/server"
import { getFeedback as getFeedbackService } from "@/services/feedback"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const professorId = searchParams.get("professorId")
    const subjectId = searchParams.get("subjectId")

    if (!professorId || !subjectId) {
        return new Response(
            JSON.stringify({
                data: [],
                errors: "Professor ID and Subject ID are required",
                message: "Failed to retrieve feedback",
            }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        )
    }

    try {
        const feedback = await getFeedbackService(professorId, subjectId)
        return new Response(
            JSON.stringify({
                data: feedback,
                errors: null,
                message: "Feedback retrieved successfully",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        )
    } catch (error) {
        console.error("Error fetching feedback:", error)
        return new Response(
            JSON.stringify({
                data: [],
                errors: "Failed to retrieve feedback",
                message: "Failed to retrieve feedback",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
