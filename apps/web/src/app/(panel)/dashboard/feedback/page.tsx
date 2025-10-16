import type { Metadata } from "next"
import { FeedbackManagement } from "@/ui/feedback/feedback"

export const metadata: Metadata = {
    title: "Gestión de Retroalimentación",
    description: "Panel de administración de retroalimentación para estudiantes y docentes de la Universidad El Bosque.",
}

export default function FeedbackPage() {
    return <FeedbackManagement />
}
