import type { Metadata } from "next"
import { Users } from "@/ui/users/users"

export const metadata: Metadata = {
    title: "Gestión de Usuarios",
    description: "Panel de administración de usuarios para estudiantes y docentes de la Universidad El Bosque.",
}

export default function UsersPage() {
    return <Users />
}
