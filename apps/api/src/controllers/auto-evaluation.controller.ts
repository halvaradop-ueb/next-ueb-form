import { Request, Response } from "express"
import {
    getAutoEvaluationAnswers,
    getAutoEvaluationAnswersByProfessor,
    saveAutoEvaluationAnswers,
} from "../services/auto-evaluation.service.js"
import { APIResponse } from "../lib/types.js"
import { errorResponse } from "../lib/utils.js"

export const getAutoEvaluationByProfessorAndSubject = async (req: Request, res: Response) => {
    try {
        const { professorId, subjectId } = req.query

        if (!professorId || !subjectId) {
            return res.status(400).json({
                error: "Professor ID and Subject ID are required",
            })
        }

        const answers = await getAutoEvaluationAnswers(professorId as string, subjectId as string)

        res.json(answers)
    } catch (error) {
        console.error("Error in getAutoEvaluationByProfessorAndSubject:", error)
        res.status(500).json({
            error: "Internal server error",
        })
    }
}

export const getAutoEvaluationByProfessor = async (req: Request, res: Response) => {
    try {
        const { professorId } = req.params

        if (!professorId) {
            return res.status(400).json({
                error: "Professor ID is required",
            })
        }

        const answers = await getAutoEvaluationAnswersByProfessor(professorId)

        res.json(answers)
    } catch (error) {
        console.error("Error in getAutoEvaluationByProfessor:", error)
        res.status(500).json({
            error: "Internal server error",
        })
    }
}

export const addAutoEvaluationAnswer = async (req: Request, res: Response<APIResponse>) => {
    try {
        const { subject, professorId, semester, answers } = req.body

        if (!subject || !professorId || !semester || !answers) {
            return res.status(400).json(errorResponse("Subject, professor ID, semester, and answers are required"))
        }

        const saveSuccess = await saveAutoEvaluationAnswers(subject, professorId, semester, answers)

        if (saveSuccess) {
            res.status(201).json({
                data: null,
                errors: null,
                message: "Auto-evaluation answer submitted successfully",
            })
        } else {
            res.status(500).json(errorResponse("Failed to save auto-evaluation answers to database"))
        }
    } catch (error) {
        console.error("Error in addAutoEvaluationAnswer:", error)
        res.status(500).json(errorResponse("Failed to submit auto-evaluation answer"))
    }
}
