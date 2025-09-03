import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const professorId = searchParams.get("professorId")
    const subjectId = searchParams.get("subjectId")

    if (!professorId || !subjectId) {
        return NextResponse.json({ message: "professorId y subjectId requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
        .from("feedback")
        .select(
            `
      id,
      rating,
      feedback_text,
      feedback_date,
      professor:professor_id (first_name, last_name),
      subject:subject_id (name)
    `,
        )
        .eq("professor_id", professorId)
        .eq("subject_id", subjectId)

    if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
