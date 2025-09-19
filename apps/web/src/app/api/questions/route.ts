import { NextRequest } from "next/server"
import { getQuestions as getQuestionsService } from "@/services/questions"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const audience = searchParams.get("audience")

    try {
        if (audience === "student") {
            // Return questions for students
            const response = await fetch("http://localhost:4000/api/v1/questions?audience=student")
            const data = await response.json()
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            })
        } else if (audience === "professor") {
            // Return questions for professors
            const response = await fetch("http://localhost:4000/api/v1/questions?audience=professor")
            const data = await response.json()
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            })
        } else {
            // Return all questions
            const response = await fetch("http://localhost:4000/api/v1/questions")
            const data = await response.json()
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            })
        }
    } catch (error) {
        console.error("Error fetching questions:", error)
        return new Response(
            JSON.stringify({
                questions: [],
                errors: "Failed to retrieve questions",
                message: "Failed to retrieve questions",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        )
    }
}
