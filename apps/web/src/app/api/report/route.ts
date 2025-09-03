import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(req: NextRequest) {
    try {
        const { data, error } = await supabase
            .from("report")
            .select(
                `
        *,
        professor:professor_id (id, first_name, last_name),
        subject:subject_id (id, name)
      `,
            )
            .order("created_at", { ascending: false })

        if (error) throw error
        return NextResponse.json(Array.isArray(data) ? data : [])
    } catch (err: any) {
        console.error("Error fetching reports:", err)
        return NextResponse.json({ message: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { title, professor_id, subject_id, comments, recommendations } = body

        if (!title) {
            return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 })
        }

        const validProfessorId = professor_id === "all" ? null : professor_id
        const validSubjectId = subject_id === "all" ? null : subject_id

        const { data: newReport, error } = await supabase
            .from("report")
            .insert({
                title,
                professor_id: validProfessorId,
                subject_id: validSubjectId,
                comments: comments || null,
                recommendations: recommendations || null,
            })
            .select()
            .single()

        if (error || !newReport) throw error || new Error("No se pudo crear el reporte")

        return NextResponse.json(newReport, { status: 201 })
    } catch (err: any) {
        console.error("Error creating report:", err)
        return NextResponse.json({ message: err.message }, { status: 500 })
    }
}
