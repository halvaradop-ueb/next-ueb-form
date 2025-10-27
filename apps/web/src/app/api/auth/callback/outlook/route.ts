import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"

export async function GET(request: NextRequest) {
    // Iniciar sesión con el usuario estudiante
    try {
        await signIn("credentials", {
            email: "elbosqueEstudiante@gmail.com",
            password: "Estudiantes@UEB",
            redirect: false,
        })
    } catch (error) {
        return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
    }

    // Redirigir a la página de estudiantes
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
}
