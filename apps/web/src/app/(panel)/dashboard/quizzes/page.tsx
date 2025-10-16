import type { Metadata } from "next"
import { Quizzes } from "@/ui/quizzes/quizzes"

export const metadata: Metadata = {
    title: "Gestión de Cuestionarios",
    description: "Panel de administración de cuestionarios para estudiantes y docentes de la Universidad El Bosque.",
}

export const QuizzesPage = () => {
    return <Quizzes />
}

export default QuizzesPage
