import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const professorId = searchParams.get("professorId")

    let query = supabase.from("subjectassignment").select("subject(id, name, description)")

    if (professorId && professorId !== "all") {
        query = query.eq("professor_id", professorId)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ message: error.message }, { status: 500 })

    return NextResponse.json({ subjects: data?.map((r) => r.subject) || [] })
}
