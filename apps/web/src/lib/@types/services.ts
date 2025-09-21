export interface QuestionService {
    id: string
    title: string
    description?: string
    question_type: "single_choice" | "multiple_choice" | "text" | "numeric"
    required: boolean
    target_audience: "student" | "professor"
    stage_id: string
}

export interface Question extends QuestionService {
    options?: string[] | null
    stage: {
        id: string
        name: string
    } | null
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

/**
 * @deprecated
 */
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
    photo?: string // Optional photo field
}

export interface ProfessorService extends UserService {}

export interface SubjectService {
    id: string
    name: string
    description: string
    /**
     * @deprecated
     */
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

export interface SubjectAssignmentService {
    id: string
    professor_id: string
    subject_id: string
    assigned_at: string
}
export interface SubjectAssignmentWithProfessorService {
    id: string
    subject_id: string
    user: {
        id: string
        email: string
        first_name: string
        last_name: string
    }
    subject: {
        id: string
        name: string
    }
}

export interface StageService {
    id: string
    name: string
    description: string
    target_audience: "student" | "professor"
    questions: Pick<QuestionService, "id" | "title" | "description">[]
}

export interface AutoEvaluationAnswer {
    id: string
    answer_id: string
    answer_text: string
    professor_id: string
    subject_id: string
    semester: string
}
