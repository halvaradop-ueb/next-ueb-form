import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Question } from "./@types/services"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const defaultAnswer = (question: Question) => {
    switch (question.question_type) {
        case "text":
            return ""
        case "single_choice":
            return ""
        case "multiple_choice":
            return []
        case "numeric":
            return 0
        default:
            return ""
    }
}
