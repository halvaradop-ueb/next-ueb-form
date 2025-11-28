import { StudentForm } from "./student-form"
import type { StudentFormProps } from "@/lib/@types/props"

export const StudentEvaluation = ({ session }: StudentFormProps) => {
    return <StudentForm session={session} />
}
