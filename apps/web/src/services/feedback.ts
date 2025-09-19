import type { Feedback, FeedbackService } from "@/lib/@types/services"
import { StudentFormState } from "@/lib/@types/types"
import { createService, createRequest } from "./utils"

export const getFeedback = async (professorId: string, subjectId: string): Promise<Feedback[]> => {
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
