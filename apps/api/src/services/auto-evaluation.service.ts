import { supabase } from "../lib/supabase.js"

export interface AutoEvaluationAnswer {
    id: string
    answer_id: string
    answer_text: string
    professor_id: string
    subject_id: string
    semester: string
    question_title?: string
    question_id?: string
    answer?: {
        question_id: string
        question: {
            title: string
        }
    }
}

export interface AutoEvaluationBySemester {
    semester: string
    answers: AutoEvaluationAnswer[]
}

export function calculateSemester(): string {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11

    // If it's after June, it's the second semester of the current year
    // If it's January to June, it's the first semester of the current year
    if (currentMonth > 6) {
        return `${currentYear} - 2`
    } else {
        return `${currentYear} - 1`
    }
}

export async function getAutoEvaluationAnswers(professorId: string, subjectId: string): Promise<AutoEvaluationBySemester[]> {
    try {
        // Get current semester for filtering
        const currentSemester = calculateSemester()
        console.log("🔍 [BACKEND] Current semester calculated:", currentSemester)

        // Query the answervalue table with proper joins to get the complete data
        console.log("🔍 [BACKEND] Querying answervalue table with joins")

        const { data: answers, error } = await supabase
            .from("answervalue")
            .select(
                `
                id,
                answer_id,
                answer_text,
                professor_id,
                subject_id,
                semester,
                answer!inner (
                    question_id,
                    question!inner (
                        title
                    )
                )
            `
            )
            .eq("professor_id", professorId)
            .eq("subject_id", subjectId)
            .eq("semester", currentSemester)

        console.log("🔍 [BACKEND] Query result:", { data: answers, error })

        if (error) {
            console.log("❌ Error querying answervalue table:", error)
            return []
        }

        if (!answers || answers.length === 0) {
            console.log("📭 No auto-evaluation data found")
            return []
        }

        console.log("✅ Successfully found data in answervalue table:", answers.length, "records")
        console.log("🔍 [Backend] Raw data from database:", answers)

        // Group answers by semester and remove duplicates
        const groupedBySemester: { [key: string]: AutoEvaluationAnswer[] } = {}

        for (const record of answers) {
            const semester = record.semester || "Sin semestre"
            if (!groupedBySemester[semester]) {
                groupedBySemester[semester] = []
            }

            // Check if answer already exists to avoid duplicates
            const existingAnswer = groupedBySemester[semester].find((a) => a.answer_id === record.answer_id)
            if (!existingAnswer) {
                // Get question title from the joined data
                let questionTitle = `Pregunta ${record.answer_id}` // Default fallback
                let questionId = record.answer_id

                // Access the joined data correctly
                const answerData = Array.isArray(record.answer) ? record.answer[0] : record.answer
                if (answerData?.question_id) {
                    questionId = answerData.question_id
                    const questionData = Array.isArray(answerData.question) ? answerData.question[0] : answerData.question
                    if (questionData?.title) {
                        questionTitle = questionData.title
                    }
                }

                console.log("🔍 [DEBUG] Processing record:", {
                    record,
                    questionTitle,
                    questionId,
                })

                groupedBySemester[semester].push({
                    id: record.id,
                    answer_id: record.answer_id,
                    answer_text: record.answer_text,
                    professor_id: record.professor_id,
                    subject_id: record.subject_id,
                    semester: record.semester,
                    question_title: questionTitle,
                    question_id: questionId,
                })
            }
        }

        // Convert grouped data to the expected format
        const result: AutoEvaluationBySemester[] = Object.entries(groupedBySemester).map(([semester, answers]) => ({
            semester,
            answers,
        }))

        console.log("🔍 [BACKEND] Final grouped result:", result)
        return result
    } catch (error) {
        return []
    }
}

export async function saveAutoEvaluationAnswers(
    subjectId: string,
    professorId: string,
    semester: string,
    answers: Record<string, any>
): Promise<boolean> {
    try {
        console.log("💾 [BACKEND] Saving auto-evaluation answers to database...")
        console.log("💾 [BACKEND] Subject ID:", subjectId)
        console.log("💾 [BACKEND] Professor ID:", professorId)
        console.log("💾 [BACKEND] Semester:", semester)
        console.log("💾 [BACKEND] Answers:", answers)

        // Convert answers object to array of records
        const answerRecords = Object.entries(answers).map(([questionId]) => ({
            question_id: questionId,
            user_id: professorId, // For auto-evaluations, professor is the "user"
        }))

        console.log("💾 [BACKEND] Answer records to insert:", answerRecords)

        // Check if answer records already exist
        const { data: existingAnswers, error: checkError } = await supabase
            .from("answer")
            .select("id, question_id")
            .in(
                "question_id",
                answerRecords.map((record) => record.question_id)
            )
            .eq("user_id", professorId)

        if (checkError) {
            console.log("❌ Error checking existing answers:", checkError)
            return false
        }

        console.log("🔍 [BACKEND] Existing answers found:", existingAnswers?.length || 0)

        // Filter out records that already exist
        const existingQuestionIds = new Set(existingAnswers?.map((answer) => answer.question_id) || [])
        const newAnswerRecords = answerRecords.filter((record) => !existingQuestionIds.has(record.question_id))

        let insertedAnswers = existingAnswers || []

        // Insert new answer records if any
        if (newAnswerRecords.length > 0) {
            console.log("💾 [BACKEND] Inserting new answer records:", newAnswerRecords.length)

            const { data: newInsertedAnswers, error: answerError } = await supabase
                .from("answer")
                .insert(newAnswerRecords)
                .select()

            if (answerError) {
                console.log("❌ Error inserting into answer table:", answerError)
                return false
            }

            if (newInsertedAnswers) {
                insertedAnswers = [...insertedAnswers, ...newInsertedAnswers]
            }

            console.log("✅ Successfully inserted new answer records:", newInsertedAnswers?.length || 0)
        }

        if (insertedAnswers.length === 0) {
            console.log("❌ No answer records available")
            return false
        }

        console.log("✅ Total answer records available:", insertedAnswers.length)

        // Now, prepare the answervalue records
        const answervalueRecords = []

        for (let i = 0; i < insertedAnswers.length; i++) {
            const answerRecord = insertedAnswers[i]
            if (!answerRecord) continue

            const questionId = answerRecord.question_id
            const answerText = answers[questionId]

            // Handle both single values and arrays
            const textValues = Array.isArray(answerText) ? answerText : [answerText]

            for (const textValue of textValues) {
                if (textValue !== null && textValue !== undefined && textValue !== "") {
                    answervalueRecords.push({
                        answer_id: answerRecord.id,
                        answer_text: String(textValue),
                        professor_id: professorId,
                        subject_id: subjectId,
                        semester: semester,
                    })
                }
            }
        }

        console.log("💾 [BACKEND] Answervalue records to insert:", answervalueRecords)

        if (answervalueRecords.length === 0) {
            console.log("⚠️ No valid answer values to insert")
            return true // Consider this a success since the answer records were created
        }

        // Insert into the answervalue table
        const { data: insertedAnswervalues, error: answervalueError } = await supabase
            .from("answervalue")
            .insert(answervalueRecords)
            .select()

        if (answervalueError) {
            console.log("❌ Error inserting into answervalue table:", answervalueError)
            return false
        }

        console.log(
            "✅ Successfully saved auto-evaluation answers to answervalue table:",
            insertedAnswervalues?.length || 0,
            "records"
        )
        return true
    } catch (error) {
        console.error("❌ Error in saveAutoEvaluationAnswers:", error)
        return false
    }
}

export async function getAutoEvaluationAnswersByProfessor(professorId: string): Promise<AutoEvaluationBySemester[]> {
    try {
        // Get current semester for filtering
        const currentSemester = calculateSemester()
        console.log("🔍 [BACKEND 2] Current semester calculated:", currentSemester)

        // Query the answervalue table with proper joins to get the complete data
        console.log("🔍 [BACKEND 2] Querying answervalue table with joins")

        const { data: answers, error } = await supabase
            .from("answervalue")
            .select(
                `
                id,
                answer_id,
                answer_text,
                professor_id,
                subject_id,
                semester,
                answer!inner (
                    question_id,
                    question!inner (
                        title
                    )
                )
            `
            )
            .eq("professor_id", professorId)
            .eq("semester", currentSemester)

        console.log("🔍 [BACKEND 2] Query result:", { data: answers, error })

        if (error) {
            console.log("❌ Error querying answervalue table:", error)
            return []
        }

        if (!answers || answers.length === 0) {
            console.log("📭 No auto-evaluation data found for professor")
            return []
        }

        console.log("✅ Successfully found data in answervalue table:", answers.length, "records")
        console.log("🔍 [Backend] Raw data from database:", answers)

        // Group answers by semester and remove duplicates
        const groupedBySemester: { [key: string]: AutoEvaluationAnswer[] } = {}

        for (const record of answers) {
            const semester = record.semester || "Sin semestre"
            if (!groupedBySemester[semester]) {
                groupedBySemester[semester] = []
            }

            // Check if answer already exists to avoid duplicates
            const existingAnswer = groupedBySemester[semester].find((a) => a.answer_id === record.answer_id)
            if (!existingAnswer) {
                // Get question title from the joined data
                let questionTitle = `Pregunta ${record.answer_id}` // Default fallback
                let questionId = record.answer_id

                // Access the joined data correctly
                const answerData = Array.isArray(record.answer) ? record.answer[0] : record.answer
                if (answerData?.question_id) {
                    questionId = answerData.question_id
                    const questionData = Array.isArray(answerData.question) ? answerData.question[0] : answerData.question
                    if (questionData?.title) {
                        questionTitle = questionData.title
                    }
                }

                console.log("🔍 [DEBUG 2] Processing record:", {
                    record,
                    questionTitle,
                    questionId,
                })

                groupedBySemester[semester].push({
                    id: record.id,
                    answer_id: record.answer_id,
                    answer_text: record.answer_text,
                    professor_id: record.professor_id,
                    subject_id: record.subject_id,
                    semester: record.semester,
                    question_title: questionTitle,
                    question_id: questionId,
                })
            }
        }

        // Convert grouped data to the expected format
        const result: AutoEvaluationBySemester[] = Object.entries(groupedBySemester).map(([semester, answers]) => ({
            semester,
            answers,
        }))

        console.log("🔍 [BACKEND 2] Final grouped result:", result)
        return result
    } catch (error) {
        return []
    }
}
