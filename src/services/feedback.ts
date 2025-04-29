import { supabase } from "@/lib/supabase/client"
import type { Feedback } from "@/lib/@types/services"

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

export const getAverageRatings = async (professorId: string, subjectId: string): Promise<number> => {
    try {
        const count = await getFeedback(professorId, subjectId)
        return count.length ? count.reduce((previous, now) => previous + now.rating, 0) / count.length : 0
    } catch (error) {
        console.error("Error fetching feedback by rating:", error)
        return 0
    }
}
