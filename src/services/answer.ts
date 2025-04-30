import { StudentFormState } from "@/lib/@types/types"
import { supabase } from "@/lib/supabase/client"
import { isArray } from "@halvaradop/ts-utility-types/validate"

export const addAnswer = async (answer: StudentFormState, studentId: string): Promise<boolean> => {
    try {
        const { answers } = answer
        Object.keys(answers).forEach(async (key) => {
            const { data: answer, error } = await supabase
                .from("answer")
                .insert({
                    question_id: key,
                    student_id: studentId,
                })
                .select()
                .single()
            if (error) {
                console.error("Error inserting answer:", error)
                throw new Error("Failed to insert answer")
            }
            const values = isArray(answers[key]) ? answers[key] : [answers[key]]
            values.map((value) => ({ answer_id: answer.id, answer_text: value }))
            const { error: errorOptions } = await supabase.from("answeroptions").insert(values).select().single()
            if (errorOptions) {
                console.error("Error inserting answer options:", error)
                throw new Error("Failed to insert answer options")
            }
        })
        return true
    } catch (error) {
        console.error("Error adding answer:", error)
        return false
    }
}
