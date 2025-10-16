import type { Metadata } from "next"
import { Subjects } from "@/ui/subjects/subjects"

export const metadata: Metadata = {
    title: "Gestión de Asignaturas",
    description: "Panel de administración de asignaturas para estudiantes y docentes de la Universidad El Bosque.",
}

export default function SubjectsPage() {
    return <Subjects />
}
