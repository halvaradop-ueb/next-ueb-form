import type { Metadata } from "next"
import { Reports } from "@/ui/report/report"

export const metadata: Metadata = {
    title: "Gestión de Reportes",
    description: "Panel de administración de reportes para estudiantes y docentes de la Universidad El Bosque.",
}

export default function ReportsPage() {
    return <Reports />
}
