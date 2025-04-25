export interface FormState {
    idle: "idle" | "loading" | "success" | "error"
    message: string
}

export type Role = "admin" | "student" | "proffessor"
