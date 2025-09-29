import { Request, Response } from "express"
import { APIResponse } from "../lib/types.js"
import { errorResponse } from "../lib/utils.js"
import {
    getAnswers,
    getAnswerById,
    getAnswersByUser,
    getAnswersByQuestion,
    addAnswer,
    saveStudentEvaluation,
} from "../services/answer.service.js"
import { supabase } from "../lib/supabase.js"

export const getAnswersController = async (_: Request, res: Response<APIResponse>) => {
    try {
        const answers = await getAnswers()
        res.status(200).json({
            data: answers,
            errors: null,
            message: "Answers retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answers:", error)
        res.status(500).json(errorResponse("Failed to retrieve answers"))
    }
}

export const getAnswerByIdController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json(errorResponse("Answer ID is required"))
        }
        const answer = await getAnswerById(id)
        res.status(200).json({
            data: answer,
            errors: null,
            message: "Answer retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answer by ID:", error)
        res.status(500).json(errorResponse("Failed to retrieve answer"))
    }
}

/**
 * @deprecated
 * @unstable
 */
export const getAnswersByUserController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const userId = req.params.userId
        if (!userId) {
            return res.status(400).json(errorResponse("User ID is required"))
        }
        const answers = await getAnswersByUser(userId)
        res.status(200).json({
            data: answers,
            errors: null,
            message: "Answers retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answers by user:", error)
        res.status(500).json(errorResponse("Failed to retrieve answers"))
    }
}

export const getAnswersByQuestionController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const questionId = req.params.questionId
        if (!questionId) {
            return res.status(400).json(errorResponse("Question ID is required"))
        }
        const answers = await getAnswersByQuestion(questionId)
        res.status(200).json({
            data: answers,
            errors: null,
            message: "Answers retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answers by question:", error)
        res.status(500).json(errorResponse("Failed to retrieve answers"))
    }
}

export const addAnswerController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const { answer, userId } = req.body
        if (!answer || !userId) {
            return res.status(400).json(errorResponse("Answer and user ID are required"))
        }
        const success = await addAnswer(answer, userId)
        if (success) {
            res.status(201).json({
                data: null,
                errors: null,
                message: "Answer added successfully",
            })
        } else {
            res.status(500).json(errorResponse("Failed to add answer"))
        }
    } catch (error) {
        console.error("Error adding answer:", error)
        res.status(500).json(errorResponse("Failed to add answer"))
    }
}

export const addStudentEvaluationController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const { professorId, subjectId, semester, answers } = req.body
        if (!professorId || !subjectId || !semester || !answers) {
            return res.status(400).json(errorResponse("Professor ID, subject ID, semester, and answers are required"))
        }
        const success = await saveStudentEvaluation(professorId, subjectId, semester, answers)
        if (success) {
            res.status(201).json({
                data: null,
                errors: null,
                message: "Student evaluation added successfully",
            })
        } else {
            res.status(500).json(errorResponse("Failed to add student evaluation"))
        }
    } catch (error) {
        console.error("Error adding student evaluation:", error)
        res.status(500).json(errorResponse("Failed to add student evaluation"))
    }
}

export const getStudentEvaluationsController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const subjectId = req.query.subjectId as string
        const semester = req.query.semester as string

        console.log("🔍 [BACKEND] getStudentEvaluationsController called:", { subjectId, semester })
        console.log("🔍 [BACKEND] Request query:", req.query)

        if (!subjectId) {
            return res.status(400).json(errorResponse("Subject ID is required"))
        }

        // First, let's see all data without filters to debug
        const { data: allData, error: allError } = await supabase.from("studenevalua").select(`
                id,
                question_id,
                response,
                id_professor,
                id_subject,
                semester
            `)

        console.log("🔍 [BACKEND] All studenevalua data:", { data: allData, error: allError, count: allData?.length })

        // Get all data for the subject (ignore semester filter for now to show all responses)
        const { data, error } = await supabase
            .from("studenevalua")
            .select(
                `
                id,
                question_id,
                response,
                id_professor,
                semester
            `
            )
            .eq("id_subject", subjectId)

        console.log("🔍 [BACKEND] Final query result:", {
            data,
            error,
            dataLength: data?.length,
            subjectId,
            semester,
            recordsFound: data?.length || 0,
        })

        if (error) {
            console.error("❌ [BACKEND] Error fetching student evaluations:", error)
            return res.status(500).json(errorResponse("Failed to fetch student evaluations"))
        }

        res.status(200).json({
            data: data || [],
            errors: null,
            message: "Student evaluations retrieved successfully",
        })
    } catch (error) {
        console.error("❌ [BACKEND] Error in getStudentEvaluationsController:", error)
        res.status(500).json(errorResponse("Failed to fetch student evaluations"))
    }
}
