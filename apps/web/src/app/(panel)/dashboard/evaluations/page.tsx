import { Metadata } from "next"
import { Evaluations } from "@/ui/evaluations/evaluations"
import { auth } from "@/lib/auth"

const defaultMetadata: Metadata = {
    title: "Evaluacion Docente",
    description: "Evaluacion Docente",
}

export const generateMetadata = async (): Promise<Metadata> => {
    const session = await auth()
    if (!session?.user) {
        return defaultMetadata
    }
    const isProfessor = session.user.role === "professor"
    return {
        title: isProfessor ? "Autoevaluación Docente" : "Evaluación Docente",
        description: isProfessor ? "Realiza tu autoevaluación docente" : "Realiza la evaluación de tus docentes",
    }
}

export default function EvaluationPage() {
    return <Evaluations />
}
