import { NextRequest } from "next/server"
import { getUsers as getUsersService } from "@/services/users"

export async function GET() {
    try {
        const users = await getUsersService()
        return new Response(
            JSON.stringify({
                data: users,
                errors: null,
                message: "Users retrieved successfully",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        )
    } catch (error) {
        console.error("Error fetching users:", error)
        return new Response(
            JSON.stringify({
                data: [],
                errors: "Failed to retrieve users",
                message: "Failed to retrieve users",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        )
    }
}
