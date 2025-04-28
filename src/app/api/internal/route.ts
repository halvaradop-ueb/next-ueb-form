import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

/**
 * This route handler is used to fetch all users from the database and check if the connection is working.
 */
export const GET = async () => {
    const supabase = await createClient()
    const { data: users } = await supabase.from("users").select()
    return NextResponse.json({
        users,
        message: "Users fetched successfully",
    })
}
