export interface QuestionService {
    id: string
    title: string
    description?: string
    category: string
    question_type: "single_choice" | "multiple_choice" | "text" | "numeric"
    required: boolean
    target_audience: "student" | "professor"
}

export interface Question extends QuestionService {
    options?: string[] | null
}

export interface QuestionOptionService {
    id: string
    question_id: string
    option_value: string
}

export interface FeedbackService {
    id: string
    student_id: string
    subject_id: string
    professor_id: string
    feedback_text: string
    feedback_date: string
    rating: number
}

export interface UserService {
    id: string
    first_name: string
    last_name: string
    email: string
    password: string
    role: "student" | "professor" | "admin"
    created_at: string
    status: boolean
    address: string
    phone: string
}

export interface ProfessorService extends UserService {}

export interface SubjectService {
    id: string
    name: string
    description: string
    professor_id: string
}

export interface Feedback extends Omit<FeedbackService, "student_id" | "subject_id" | "professor_id"> {
    student: {
        first_name: string
        last_name: string
    }
    professor: {
        first_name: string
        last_name: string
    }
    subject: {
        name: string
    }
}

export interface AnswerService {
    id: string
    question_id: string
    student_id: string
    answer_text: string | string[]
    selected_option: string
}
