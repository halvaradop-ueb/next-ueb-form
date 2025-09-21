import { supabase } from "../lib/supabase.js"

export interface AutoEvaluationAnswer {
    id: string
    answer_id: string
    answer_text: string
    professor_id: string
    subject_id: string
    semester: string
}

export async function getAutoEvaluationAnswers(professorId: string, subjectId: string): Promise<AutoEvaluationAnswer[]> {
    try {
        console.log(`Fetching autoevaluation answers for professor: ${professorId}, subject: ${subjectId}`)

        // Try different possible table names
        const possibleTableNames = ["answerdvalue", "answervalue", "answer_dvalue", "answer_value"]

        for (const tableName of possibleTableNames) {
            try {
                console.log(`Trying table name: ${tableName}`)
                const { data: answers, error } = await supabase
                    .from(tableName)
                    .select(
                        `
                        id,
                        answer_id,
                        answer_text,
                        professor_id,
                        subject_id,
                        semester
                    `
                    )
                    .eq("professor_id", professorId)
                    .eq("subject_id", subjectId)

                if (!error) {
                    console.log(`Successfully found data in table: ${tableName}, count: ${answers?.length || 0}`)
                    return answers || []
                } else {
                    console.log(`Table ${tableName} not found or error: ${error.message}`)
                }
            } catch (tableError) {
                console.log(`Error with table ${tableName}:`, tableError)
            }
        }

        // If we get here, none of the table names worked
        console.log("No valid table name found for autoevaluation data")
        return []
    } catch (error) {
        console.error("Error fetching autoevaluation answers:", error)
        return []
    }
}

export async function getAutoEvaluationAnswersByProfessor(professorId: string): Promise<AutoEvaluationAnswer[]> {
    try {
        console.log(`Fetching autoevaluation answers for professor: ${professorId}`)

        // Try different possible table names
        const possibleTableNames = ["answerdvalue", "answervalue", "answer_dvalue", "answer_value"]

        for (const tableName of possibleTableNames) {
            try {
                console.log(`Trying table name: ${tableName}`)
                const { data: answers, error } = await supabase
                    .from(tableName)
                    .select(
                        `
                        id,
                        answer_id,
                        answer_text,
                        professor_id,
                        subject_id,
                        semester
                    `
                    )
                    .eq("professor_id", professorId)

                if (!error) {
                    console.log(`Successfully found data in table: ${tableName}, count: ${answers?.length || 0}`)
                    return answers || []
                } else {
                    console.log(`Table ${tableName} not found or error: ${error.message}`)
                }
            } catch (tableError) {
                console.log(`Error with table ${tableName}:`, tableError)
            }
        }

        // If we get here, none of the table names worked
        console.log("No valid table name found for autoevaluation data")
        return []
    } catch (error) {
        console.error("Error fetching autoevaluation answers for professor:", error)
        return []
    }
}
