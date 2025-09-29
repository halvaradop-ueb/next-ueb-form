import { ProfessorFormState, StudentFormState } from "@/lib/@types/types"
import { createService, createRequest } from "./utils"

export const addAnswer = async <FormSchema extends StudentFormState | ProfessorFormState>(
    answer: FormSchema,
    userId: string
): Promise<boolean> => {
    try {
        const request = createRequest("POST", "answers", { answer, userId })
        const result = await createService(request)
        return !!result
    } catch (error) {
        console.error("Error en addAnswer:", error)
        return false
    }
}

export const addAutoEvaluationAnswer = async (
    formData: ProfessorFormState,
    userId: string
): Promise<{ success: boolean; data?: any; error?: string; details?: any }> => {
    try {
        // Validate required fields
        if (!formData.subject || !formData.professorId || !formData.semester || !formData.answers) {
            console.error("Missing required fields in formData:", {
                subject: formData.subject,
                professorId: formData.professorId,
                semester: formData.semester,
                answers: formData.answers,
            })
            return { success: false, error: "Missing required fields" }
        }

        // Transform the form data to match the expected API format
        const autoEvaluationData = {
            subject: formData.subject,
            professorId: formData.professorId,
            semester: formData.semester,
            answers: formData.answers,
        }

        console.log("📤 [FRONTEND] Sending auto-evaluation data:", autoEvaluationData)

        const request = createRequest("POST", "auto-evaluation", autoEvaluationData)
        const result = await createService(request)

        console.log("📥 [FRONTEND] Response received:", result)

        if (result && result.message === "Auto-evaluation answer submitted successfully") {
            console.log("✅ [FRONTEND] Auto-evaluation submitted successfully")
            console.log("📊 [FRONTEND] Response:", result)

            return {
                success: true,
                data: result,
            }
        } else {
            console.error("❌ [FRONTEND] Failed to submit auto-evaluation")
            console.error("❌ [FRONTEND] Error details:", result?.errors || result?.message || "Unknown error")

            // Handle different error formats
            let errorMessage = "Failed to submit auto-evaluation"
            if (result?.errors && Array.isArray(result.errors)) {
                errorMessage = result.errors.join(". ")
            } else if (result?.message) {
                errorMessage = result.message
            }

            return {
                success: false,
                error: errorMessage,
                details: result,
            }
        }
    } catch (error) {
        console.error("❌ [FRONTEND] Error in addAutoEvaluationAnswer:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

export const verifyAutoEvaluationData = async (
    professorId: string,
    subjectId: string,
    semester?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        console.log("🔍 [FRONTEND] Verifying auto-evaluation data:", { professorId, subjectId, semester })

        const params = new URLSearchParams({ professorId, subjectId })
        if (semester) params.append("semester", semester)

        const request = createRequest("GET", `auto-evaluation/verify?${params}`)
        const result = await createService(request)

        console.log("📥 [FRONTEND] Verification response:", result)

        if (result && result.data) {
            return {
                success: true,
                data: result.data,
            }
        } else {
            return { success: false, error: "No data found" }
        }
    } catch (error) {
        console.error("❌ [FRONTEND] Error verifying auto-evaluation data:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

export const addStudentEvaluation = async (
    professorId: string,
    subjectId: string,
    semester: string,
    answers: Record<string, any>
): Promise<boolean> => {
    try {
        console.log("📤 [FRONTEND] Sending student evaluation data:", {
            professorId,
            subjectId,
            semester,
            answers,
        })

        const request = createRequest("POST", "answers/student-evaluation", {
            professorId,
            subjectId,
            semester,
            answers,
        })
        const result = await createService(request)

        console.log("📥 [FRONTEND] Student evaluation response:", result)

        return !!result
    } catch (error) {
        console.error("❌ [FRONTEND] Error in addStudentEvaluation:", error)
        return false
    }
}

export const getStudentEvaluationsBySubject = async (
    subjectId: string,
    semester?: string
): Promise<Array<{ question_id: string; response: string; id_professor: string; semester?: string }>> => {
    try {
        console.log("🔍 [FRONTEND] Fetching student evaluations:", { subjectId, semester })

        const params = new URLSearchParams({ subjectId })
        if (semester) {
            params.append("semester", semester)
            console.log("🔍 [FRONTEND] Appended semester to params:", semester)
        }

        const request = createRequest("GET", `answers/student-evaluations?${params}`)
        console.log("🔍 [FRONTEND] Request URL:", request.url)

        const result = await createService(request)

        console.log("📥 [FRONTEND] Student evaluations response:", result)

        return result?.data || []
    } catch (error) {
        console.error("❌ [FRONTEND] Error fetching student evaluations:", error)
        return []
    }
}
