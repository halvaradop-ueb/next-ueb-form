import { auth } from "@/lib/auth"
import { StudentForm } from "@/ui/dashboard/evaluations/students/student-form"
import { ProffessorForm } from "@/ui/dashboard/evaluations/proffessor/proffessor-form"

const EvaluationsPage = async () => {
    const session = await auth()
    const user: "proffessor" | "student" = true ? "proffessor" : "student"

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Evaluation Docente</h1>
                <p className="text-gray-600">Evaluación de los docentes por parte de los estudiantes</p>
            </div>
            {user === "student" && <StudentForm />}
            {user === "proffessor" && <ProffessorForm />}
        </div>
    )
}

export default EvaluationsPage
