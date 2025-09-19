import type { Feedback, FeedbackService } from "@/lib/@types/services"
import { StudentFormState } from "@/lib/@types/types"
import { createService, createRequest } from "./utils"

export const getFeedback = async (professorId: string, subjectId: string): Promise<Feedback[]> => {
    // In production, use Next.js API routes
    if (process.env.NODE_ENV === "production") {
        try {
            const response = await fetch(`/api/feedback?professorId=${professorId}&subjectId=${subjectId}`)
            if (!response.ok) {
                throw new Error(`Error fetching feedback: ${response.statusText}`)
            }
            const json = await response.json()
            return json.data || []
        } catch (error) {
            console.error("Error fetching feedback:", error)
            return []
        }
    }

    // In development, use the Express API
    try {
        const request = createRequest("GET", `feedback?professorId=${professorId}&subjectId=${subjectId}`)
        const result = await createService(request)
        return result || []
    } catch (error) {
        console.error("Error fetching feedback:", error)
        return []
    }
}

export const addFeedback = async (feedback: StudentFormState, studentId: string): Promise<FeedbackService | null> => {
    try {
        const request = createRequest("POST", "feedback", { ...feedback, studentId })
        return createService(request)
    } catch (error) {
        console.error("Error adding feedback:", error)
        return null
    }
}
