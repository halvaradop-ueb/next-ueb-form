export interface QuestionService {
    id: string
    title: string
    description?: string
    category: string
    question_type: "single_choice" | "multiple_choice" | "text"
    required: boolean
}

export interface Question extends QuestionService {
    options?: string[] | null
}

export interface QuestionOptionService {
    id: string
    question_id: string
    option_value: string
}
