import { supabase } from "../lib/supabase.js"

type QuestionOptionRow = {
    option_value: string
}

export const getQuestionOptions = async (questionId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase.from("questionoptions").select("option_value").eq("question_id", questionId)

        if (error) throw new Error(`Error fetching options for question ${questionId}: ${error.message}`)

        const options = (data as QuestionOptionRow[]) || []

        return options.map((option) => option.option_value)
    } catch (error) {
        console.error("Error fetching question options:", error)
        return []
    }
}
export const addQuestionOptions = async (questionId: string, options: string[]): Promise<boolean> => {
    try {
        const insertData = options.map((option) => ({ question_id: questionId, option_value: option }))
        const { error } = await supabase.from("questionoptions").insert(insertData)
        if (error) throw new Error(`Error adding options for question ${questionId}: ${error.message}`)
        return true
    } catch (error) {
        console.error("Error adding question options:", error)
        return false
    }
}

export const deleteQuestionOptions = async (questionId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from("questionoptions").delete().eq("question_id", questionId)
        if (error) throw new Error(`Error deleting options for question ${questionId}: ${error.message}`)
        return true
    } catch (error) {
        console.error("Error deleting question options:", error)
        return false
    }
}
