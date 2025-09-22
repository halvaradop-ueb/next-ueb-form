import { z } from "zod"

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

/**
 * Google Profile Interface used by NextAuth
 * @see https://next-auth.js.org/providers/google
 */
export interface GoogleProfile {
    iss: string
    azp: string
    aud: string
    sub: string
    email: string
    email_verified: boolean
    at_hash: string
    name: string
    picture: string
    given_name: string
    iat: number
    exp: number
}

export type FormSchema = StudentFormState | ProfessorFormState

export interface Step {
    id: string
    name: string
    component: React.ReactNode
    schema: z.ZodObject<any>
}
