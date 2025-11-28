import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ProfessorEvaluation } from "@/ui/dashboard/evaluations/proffessor/professor-evaluation"
import { StudentEvaluation } from "../dashboard/evaluations/students/student-evaluation"

export const Evaluations = async () => {
    const session = await auth()
    if (!session) {
        redirect("/auth")
    }

    const userRole = session.user?.role

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">
                    {userRole === "professor" ? "Autoevaluación Docente" : "Evaluación Docente"}
                </h1>
                <p className="text-gray-600">
                    {userRole === "professor"
                        ? "Reflexiona sobre tu enseñanza y desempeño docente"
                        : "Evalúa a tus docentes y proporciona comentarios"}
                </p>
            </div>
            {userRole === "student" ? <StudentEvaluation session={session} /> : null}
            {userRole === "professor" ? <ProfessorEvaluation session={session} /> : null}
        </div>
    )
}
