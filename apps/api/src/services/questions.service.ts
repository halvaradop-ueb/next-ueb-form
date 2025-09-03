import { supabase } from "../lib/supabase.js"

export const getQuestions = async (): Promise<any[]> => {
    try {
        const { data: questions, error } = await supabase.from("question").select(`
        id,
        title,
        description,
        question_type,
        target_audience,
        required,
        target_audience,
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
                    const { data: options, error } = await supabase
                        .from("questionoptions")
                        .select("option_value")
                        .eq("question_id", question.id)

                    if (error) {
                        throw new Error(`Error fetching options for question ${question.id}: ${error.message}`)
                    }

                    return {
                        ...question,
                        options: (options || []).map((option: any) => option.option_value),
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
        const { data: questionId, error } = await supabase.from("question").insert(spread).select("id").single()
        if (error) {
            throw new Error(`Error adding question: ${error.message}`)
        }
        if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
            const questionOptions = options?.map((option: any) => ({
                question_id: questionId.id,
                option_value: option,
            }))
            const { error: optionsError } = await supabase.from("questionoptions").insert(questionOptions).select("id")
            if (optionsError) {
                throw new Error(`Error adding question options: ${optionsError.message}`)
            }
        }
        return question
    } catch (error) {
        console.error("Error adding question:", error)
        return null
    }
}

export const cleanQuestionOptions = async (questionId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from("questionoptions").delete().eq("question_id", questionId)
        if (error) {
            throw new Error(`Error cleaning question options: ${error.message}`)
        }
        return true
    } catch (error) {
        console.error("Error cleaning question:", error)
        return false
    }
}

export const updateQuestion = async (question: any): Promise<any | null> => {
    try {
        const { id, options, stage, ...spread } = question
        const { data, error } = await supabase.from("question").update(spread).eq("id", id)
        if (error) {
            throw new Error(`Error updating question: ${error.message}`)
        }
        await cleanQuestionOptions(id)
        if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
            const questionOptions = options?.map((option: any) => ({
                question_id: id,
                option_value: option,
            }))
            const { error: optionsError } = await supabase.from("questionoptions").upsert(questionOptions).select("id")
            if (optionsError) {
                throw new Error(`Error updating question options: ${optionsError.message}`)
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
