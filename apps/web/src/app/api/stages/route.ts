import { NextRequest } from "next/server"
import { getStages as getStagesService } from "@/services/stages"

export async function GET() {
    try {
        const stages = await getStagesService()
        return new Response(
            JSON.stringify({
                data: stages,
                errors: null,
                message: "Stages retrieved successfully",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        )
    } catch (error) {
        console.error("Error fetching stages:", error)
        return new Response(
            JSON.stringify({
                data: [],
                errors: "Failed to retrieve stages",
                message: "Failed to retrieve stages",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        )
    }
}
