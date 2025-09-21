export interface Question {
    id: string
    title: string
    description?: string
    question_type: "single_choice" | "multiple_choice" | "text" | "numeric"
    required: boolean
    target_audience: "student" | "professor"
    stage_id: string
    stage?: {
        id: string
        name: string
    } | null
    options?: string[] | null
}
