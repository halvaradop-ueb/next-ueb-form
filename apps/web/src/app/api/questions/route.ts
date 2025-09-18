import { NextRequest } from "next/server"
import { getQuestions, addQuestion, updateQuestion, deleteQuestion } from "@/services/questions"

export async function GET(request: NextRequest) {
    try {
        const questions = await getQuestions()
        return new Response(JSON.stringify({ questions }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Error fetching questions:", error)
        return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const newQuestion = await addQuestion(body)
        return new Response(JSON.stringify(newQuestion), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Error adding question:", error)
        return new Response(JSON.stringify({ error: "Failed to add question" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const updatedQuestion = await updateQuestion(body)
        return new Response(JSON.stringify(updatedQuestion), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Error updating question:", error)
        return new Response(JSON.stringify({ error: "Failed to update question" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return new Response(JSON.stringify({ error: "Missing question id" }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                },
            })
        }

        const result = await deleteQuestion(id)
        return new Response(JSON.stringify({ success: result }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
            },
        })
    } catch (error) {
        console.error("Error deleting question:", error)
        return new Response(JSON.stringify({ error: "Failed to delete question" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
            },
        })
    }
}
