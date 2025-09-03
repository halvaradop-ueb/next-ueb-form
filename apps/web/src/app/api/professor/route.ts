import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET() {
    try {
        const { data, error } = await supabase.from("User").select("id, first_name, last_name").eq("role", "professor")

        console.log("Supabase data:", data)
        console.log("Supabase error:", error)

        if (error) throw error

        return NextResponse.json({ users: data })
    } catch (err) {
        console.error("API GET /professor error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
