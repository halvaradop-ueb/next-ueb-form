import { ProfessorFormState, StudentFormState } from "@/lib/@types/types"
import { supabase } from "@/lib/supabase/client"
import { isArray } from "@halvaradop/ts-utility-types/validate"

export const addAnswer = async <FormSchema extends StudentFormState | ProfessorFormState>(
    answer: FormSchema,
    userId: string,
): Promise<boolean> => {
    try {
        const { answers } = answer
        Object.keys(answers).forEach(async (key) => {
            const values = isArray(answers[key]) ? answers[key] : [answers[key]]
            const filteredValues = values.filter((value) => value !== null && value !== undefined)

            if (filteredValues.length === 0) {
                return
            }

            const { data: answer, error } = await supabase
                .from("answer")
                .insert({
                    question_id: key,
                    user_id: userId,
                })
                .select()
                .single()
            if (error) {
                console.error("Error inserting answer:", error)
                throw new Error("Failed to insert answer")
            }

            const answerOptions = filteredValues.map((value) => ({
                answer_id: answer.id,
                answer_text: value,
            }))
            const { error: errorOptions } = await supabase.from("answervalue").insert(answerOptions)
            if (errorOptions) {
                console.error("Error inserting answer options:", errorOptions)
                throw new Error("Failed to insert answer options")
            }
        })
        return true
    } catch (error) {
        console.error("Error adding answer:", error)
        return false
    }
}
