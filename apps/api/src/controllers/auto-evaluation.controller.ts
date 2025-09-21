import { Request, Response } from "express"
import { getAutoEvaluationAnswers, getAutoEvaluationAnswersByProfessor } from "../services/auto-evaluation.service.js"

export const getAutoEvaluationByProfessorAndSubject = async (req: Request, res: Response) => {
    try {
        const { professorId, subjectId } = req.query

        if (!professorId || !subjectId) {
            return res.status(400).json({
                error: "Professor ID and Subject ID are required",
            })
        }

        const answers = await getAutoEvaluationAnswers(professorId as string, subjectId as string)

        res.json({
            success: true,
            data: answers,
        })
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

        res.json({
            success: true,
            data: answers,
        })
    } catch (error) {
        console.error("Error in getAutoEvaluationByProfessor:", error)
        res.status(500).json({
            error: "Internal server error",
        })
    }
}
