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
                throw new Error("Failed to insert answer")
            }

            const answerOptions = filteredValues.map((value: any) => ({
                answer_id: answerRow.id,
                answer_text: value,
            }))
            const { error: errorOptions } = await supabase.from("answervalue").insert(answerOptions)
            if (errorOptions) {
                throw new Error("Failed to insert answer options")
            }
        }
        return true
    } catch (error) {
        return false
    }
}

export async function getStudentEvaluationsBySubject(subjectId: string) {
    try {
        // Get evaluations for the subject, checking both old and new column structures
        const { data, error } = await supabase
            .from("studenevalua")
            .select(
                `
                id,
                question_id,
                response,
                id_professor,
                id_docente,
                semester
            `
            )
            .eq("id_subject", subjectId)

        if (error) {
            console.error("❌ Error fetching student evaluations:", error)
            throw new Error(error.message)
        }

        // Transform data to ensure we have the correct professor ID
        const transformedData = (data || []).map((evaluation) => ({
            ...evaluation,
            // Use id_docente if available, otherwise fall back to id_professor
            id_professor: evaluation.id_docente || evaluation.id_professor,
        }))

        console.log("✅ Retrieved student evaluations:", transformedData.length, "records")
        return transformedData
    } catch (error) {
        console.error("❌ Error in getStudentEvaluationsBySubject:", error)
        return []
    }
}

export async function saveStudentEvaluation(
    professorId: string,
    subjectId: string,
    semester: string,
    answers: Record<string, any>
): Promise<boolean> {
    try {
        console.log("🔍 [SERVICE] Saving student evaluation:", {
            professorId,
            subjectId,
            semester,
            answersCount: Object.keys(answers).length,
        })

        // Convert answers object to array of records for the studenevalua table
        const studentEvaluationRecords = []

        for (const [questionId, answerValue] of Object.entries(answers)) {
            // Handle both single values and arrays
            const textValues = Array.isArray(answerValue) ? answerValue : [answerValue]

            for (const textValue of textValues) {
                if (textValue !== null && textValue !== undefined && textValue !== "") {
                    const record = {
                        // Store the professor ID in id_professor
                        id_professor: professorId,
                        id_subject: subjectId,
                        question_id: questionId,
                        response: String(textValue),
                        semester: semester,
                    }
                    console.log("📝 [SERVICE] Created record:", record)
                    studentEvaluationRecords.push(record)
                }
            }
        }

        if (studentEvaluationRecords.length === 0) {
            console.log("⚠️ [SERVICE] No valid answers to save")
            return true // Consider this a success since no data to save
        }

        console.log("💾 [SERVICE] Inserting records:", studentEvaluationRecords.length)

        // Insert into the studenevalua table
        const { data: insertedRecords, error } = await supabase.from("studenevalua").insert(studentEvaluationRecords).select()

        if (error) {
            console.log("❌ Error inserting into studenevalua table:", error)
            console.log("🔍 [SERVICE] Insert data:", studentEvaluationRecords)
            return false
        }

        console.log("✅ Successfully saved student evaluation to studenevalua table:", insertedRecords?.length || 0, "records")
        console.log("📊 [SERVICE] Inserted records:", insertedRecords)
        return true
    } catch (error) {
        console.error("❌ Error in saveStudentEvaluation:", error)
        return false
    }
}
