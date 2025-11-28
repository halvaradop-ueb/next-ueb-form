import { Metadata } from "next"
import { ProfessorFormProps } from "@/lib/@types/props"
import { ProffessorForm } from "./proffessor-form"

export const metadata: Metadata = {
    title: "Autoevaluación Docente",
    description: "Autoevaluación Docente",
}

export const ProfessorEvaluation = ({ session }: ProfessorFormProps) => {
    return <ProffessorForm session={session} />
}
