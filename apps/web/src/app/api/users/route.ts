import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const role = searchParams.get("role")

        let query = supabase.from("User").select("*")
        if (role) query = query.eq("role", role)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json(Array.isArray(data) ? data : [])
    } catch (err: any) {
        console.error("Unexpected error:", err)
        return NextResponse.json({ error: err.message || "Ocurrió un error inesperado" }, { status: 500 })
    }
}
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { first_name, last_name, email, role } = body

        if (!first_name || !last_name || !email || !role) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
        }

        const { data, error } = await supabase.from("User").insert({
            first_name,
            last_name,
            email,
            role,
            created_at: new Date().toISOString(),
        })
        if (error) throw error

        return NextResponse.json(data, { status: 201 })
    } catch (err: any) {
        console.error("Error adding user:", err)
        return NextResponse.json({ error: err.message || "Error al agregar usuario" }, { status: 500 })
    }
}
