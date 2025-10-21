export * from "./stage"
export * from "./question"
export * from "./report"
export * from "./user"

import { Question } from "./question"
import { User } from "./user"

/**
 * @deprecated
 */
export type QuestionService = Question

/**
 * @deprecated
 */
export type UserService = User

export interface PeerReview {
    professor: string
    subject: string
    semestre?: string
    comments?: string
    findings?: string
}
