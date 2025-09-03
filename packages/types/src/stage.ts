import { Question } from "./question"

export interface Stage {
    id: string
    name: string
    description: string
    target_audience: "student" | "professor"
    questions: Pick<Question, "id" | "title" | "description">[]
}
