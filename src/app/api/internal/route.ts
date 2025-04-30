import { NextResponse } from "next/server"
import { getQuestions } from "@/services/questions"
import { supabase } from "@/lib/supabase/client"

/**
 * This route handler is used to fetch all users from the database and check if the connection is working.
 */
export const GET = async () => {
    const questions = await getQuestions()

    return NextResponse.json({
        questions,
        message: "Users fetched successfully",
    })
}
