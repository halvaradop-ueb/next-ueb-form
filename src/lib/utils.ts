import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Question } from "./@types/services"
import { supabase } from "./supabase/client"
import { hashPassword } from "@/services/auth"

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

export const updateDatabase = async (role: string, value: string) => {
    const hash = await hashPassword(value)
    const { data, error } = await supabase.from("User").update({ password: hash }).eq("role", role)

    if (error) {
        console.error("Error updating admin password:", error)
    } else {
        console.log("Admin password updated successfully:", data)
    }
}
