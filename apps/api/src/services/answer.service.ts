import { supabase } from "../lib/supabase.js"

export async function getAnswers() {
    const { data, error } = await supabase.from("answer").select("*, answervalue(id, answer_text)")
    if (error) throw new Error(error.message)
    return data
}

export async function getAnswerById(id: string) {
    const { data, error } = await supabase.from("answer").select("*, answervalue(id, answer_text)").eq("id", id).single()
    if (error) throw new Error(error.message)
    return data
}

/**
 * @deprecated
 * @unstable
 */
export async function getAnswersByUser(userId: string) {
    const { data, error } = await supabase.from("answer").select("*, answervalue(id, answer_text)").eq("user_id", userId)
    if (error) throw new Error(error.message)
    return data
}

export async function getAnswersByQuestion(questionId: string) {
    const { data, error } = await supabase.from("answer").select("*, answervalue(id, answer_text)").eq("question_id", questionId)
    if (error) throw new Error(error.message)
    return data
}

export async function addAnswer(answer: any, userId: string): Promise<boolean> {
    try {
        const { answers } = answer
        for (const key of Object.keys(answers)) {
            const values = Array.isArray(answers[key]) ? answers[key] : [answers[key]]
            const filteredValues = values.filter((value: any) => value !== null && value !== undefined)

            if (filteredValues.length === 0) {
                continue
            }

            const { data: answerRow, error } = await supabase
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

            const answerOptions = filteredValues.map((value: any) => ({
                answer_id: answerRow.id,
                answer_text: value,
            }))
            const { error: errorOptions } = await supabase.from("answervalue").insert(answerOptions)
            if (errorOptions) {
                console.error("Error inserting answer options:", errorOptions)
                throw new Error("Failed to insert answer options")
            }
        }
        return true
    } catch (error) {
        console.error("Error adding answer:", error)
        return false
    }
}

export async function getStudentEvaluationsBySubject(subjectId: string) {
    const { data, error } = await supabase.from("studenevalua").select("*").eq("id_subject", subjectId)

    if (error) throw new Error(error.message)
    return data
}

export async function saveStudentEvaluation(
    professorId: string,
    subjectId: string,
    semester: string,
    answers: Record<string, any>
): Promise<boolean> {
    try {
        const studentEvaluationRecords = []

        for (const [questionId, answerValue] of Object.entries(answers)) {
            const textValues = Array.isArray(answerValue) ? answerValue : [answerValue]
            for (const textValue of textValues) {
                if (textValue !== null && textValue !== undefined && textValue !== "") {
                    studentEvaluationRecords.push({
                        id_professor: professorId,
                        id_subject: subjectId,
                        question_id: questionId,
                        response: String(textValue),
                        semester: semester,
                    })
                }
            }
        }

        if (studentEvaluationRecords.length === 0) {
            return true // Consider this a success since no data to save
        }

        const { data: insertedRecords, error } = await supabase.from("studenevalua").insert(studentEvaluationRecords).select()

        if (error) {
            return false
        }
        return true
    } catch (error) {
        console.error("❌ Error in saveStudentEvaluation:", error)
        return false
    }
}
