import { z } from "zod"
export type { GoogleProfile } from "next-auth/providers/google"

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
    professorId: string
    subjectId: string
    timeframe: string
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
    professorId: string
    semester: string
    answers: Record<string, string | string[]>
}

export type FormSchema = StudentFormState | ProfessorFormState

export interface Step {
    id: string
    name: string
    component: React.ReactNode
    schema: z.ZodObject<any>
}
