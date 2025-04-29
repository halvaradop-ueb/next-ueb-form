export interface FormState {
    idle: "idle" | "loading" | "success" | "error"
    message: string
}

export type Role = "admin" | "student" | "proffessor"

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
