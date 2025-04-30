export interface FormState {
    idle: "idle" | "loading" | "success" | "error"
    message: string
}

export type Role = "admin" | "student" | "professor"

export interface ReportState {
    title: string
    professor: string
    subject: string
    timeframe: string
    comments: string
    recommendations: string
    date: string
}

export interface FeedbackState {
    professor: string
    subject: string
    timeframe: string
    averageRating: number
}

export interface StudentFormState {
    professor: string
    subject: string
    answers: Record<string, string | string[]>
    comment: string
    rating: number
}

export interface ProfessorFormState {
    subject: string
    answers: Record<string, string | string[]>
}
