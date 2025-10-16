import type { Metadata } from "next"
import { Stages } from "@/ui/stages/stages"

export const metadata: Metadata = {
    title: "Gestión de Etapas",
    description: "Panel de administración de etapas para estudiantes y docentes de la Universidad El Bosque.",
}

export const StagesPage = () => {
    return <Stages />
}

export default StagesPage
