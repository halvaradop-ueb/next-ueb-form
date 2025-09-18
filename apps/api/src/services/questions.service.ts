import { supabase } from "../lib/supabase.js"
import { getQuestionOptions, addQuestionOptions, deleteQuestionOptions } from "./question-options.service.js"

export const getQuestions = async (): Promise<any[]> => {
    try {
        const { data: questions, error } = await supabase.from("question").select(`
        id,
        title,
        description,
        question_type,
        target_audience,
        required,
        stage_id,
        stage: stage_id (
          id,
          name
        )
      `)
        if (error) {
            throw new Error(`Error fetching questions: ${error.message}`)
        }

        const questionsWithOptions = await Promise.all(
            (questions || []).map(async (question: any) => {
                if (["single_choice", "multiple_choice"].includes(question.question_type)) {
                    const options = await getQuestionOptions(question.id)
                    return {
                        ...question,
                        options,
                    }
                }

                return {
                    ...question,
                    options: null,
                }
            }),
        )

        return questionsWithOptions
    } catch (error) {
        console.error("Error fetching questions:", error)
        return []
    }
}

export const addQuestion = async (question: any): Promise<any | null> => {
    try {
        const { id, options, ...spread } = question
        const { data: insertedData, error: insertError } = await supabase.from("question").insert(spread).select().single()
        if (insertError) {
            throw new Error(`Error adding question: ${insertError.message}`)
        }
        
        // Fetch the complete question with all fields including the ID
        const { data: completeQuestion, error: fetchError } = await supabase
            .from("question")
            .select(`
                id,
                title,
                description,
                question_type,
                target_audience,
                required,
                stage_id,
                stage: stage_id (
                    id,
                    name
                )
            `)
            .eq("id", insertedData.id)
            .single()
        
        if (fetchError) {
            throw new Error(`Error fetching created question: ${fetchError.message}`)
        }
        
        // Add options if needed
        if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
            const added = await addQuestionOptions(completeQuestion.id, options || [])
            if (!added) {
                throw new Error(`Error adding question options`)
            }
        }
        
        return completeQuestion
    } catch (error) {
        console.error("Error adding question:", error)
        return null
    }
}

export const updateQuestion = async (question: any): Promise<any | null> => {
    try {
        const { id, options, stage, ...spread } = question
        const { data, error } = await supabase.from("question").update(spread).eq("id", id)
        if (error) {
            throw new Error(`Error updating question: ${error.message}`)
        }
        await deleteQuestionOptions(id)
        if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
            const added = await addQuestionOptions(id, options || [])
            if (!added) {
                throw new Error(`Error updating question options`)
            }
        }
        return data
    } catch (error) {
        console.error("Error updating question:", error)
        return null
    }
}

export const deleteQuestion = async (id: string): Promise<boolean> => {
    try {
        // Delete associated options first
        await deleteQuestionOptions(id)
        const { error } = await supabase.from("question").delete().eq("id", id)
        if (error) {
            throw new Error(`Error deleting question: ${error.message}`)
        }
        return true
    } catch (error) {
        console.error("Error deleting question:", error)
        return false
    }
}

export const getQuestionsForStudents = async (): Promise<[any[], Partial<Record<string, any[]>>]> => {
    const questions = await getQuestions()
    const filteredQuestions = questions.filter((question: any) => question.target_audience === "student")
    // Object.groupBy is not available in Node.js yet, so use reduce
    const grouped = filteredQuestions.reduce((acc: any, question: any) => {
        const key = question.stage?.name || ""
        if (!acc[key]) acc[key] = []
        acc[key].push(question)
        return acc
    }, {})
    return [filteredQuestions, grouped]
}

export const getQuestionsForProfessors = async (): Promise<[any[], Partial<Record<string, any[]>>]> => {
    const questions = await getQuestions()
    const filteredQuestions = questions.filter((question: any) => question.target_audience === "professor")
    const grouped = filteredQuestions.reduce((acc: any, question: any) => {
        const key = question.stage?.name || ""
        if (!acc[key]) acc[key] = []
        acc[key].push(question)
        return acc
    }, {})
    return [filteredQuestions, grouped]
}
