import { supabase } from "@/lib/supabase/client"
import type { Feedback, FeedbackService } from "@/lib/@types/services"
import { StudentFormState } from "@/lib/@types/types"

export const getFeedback = async (professorId: string, subjectId: string): Promise<Feedback[]> => {
    try {
        const { data: feedback, error } = await supabase
            .from("feedback")
            .select(
                `
                id,
                rating,
                feedback_text,
                feedback_date,
                student:student_id (
                    first_name,
                    last_name
                ),
                professor:professor_id (
                    first_name,
                    last_name
                ),
                subject:subject_id (
                    name
                )
            `,
            )
            .eq("subject_id", subjectId)
            .eq("professor_id", professorId)
        if (error) {
            throw new Error(`Error fetching feedback: ${error.message}`)
        }
        return feedback as unknown as Feedback[]
    } catch (error) {
        console.error("Error fetching feedback:", error)
        return []
    }
}

export const addFeedback = async (feedback: StudentFormState, studentId: string): Promise<FeedbackService | null> => {
    try {
        const { subject, professor, comment } = feedback
        const { data, error } = await supabase
            .from("feedback")
            .insert({
                student_id: studentId,
                subject_id: subject,
                professor_id: professor,
                feedback_text: comment,
                rating: feedback.rating,
            })
            .single()
        if (error) {
            throw new Error(`Error adding feedback: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error adding feedback:", error)
        return null
    }
}
