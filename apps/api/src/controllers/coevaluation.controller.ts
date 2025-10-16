import { Request, Response } from "express"
import { errorResponse } from "../lib/utils.js"
import { getAllCoEvaluations } from "../services/coevaluation.service.js"

export const getAllCoEvaluationsController = async (req: Request, res: Response) => {
    try {
        const { professorId, subjectId } = req.query

        const coEvaluations = await getAllCoEvaluations(professorId as string, subjectId as string)

        if (!coEvaluations) {
            return res.status(404).json(errorResponse("No co-evaluations found"))
        }
        res.json(coEvaluations)
    } catch (error) {
        console.error("❌ [API] Error in getAllCoEvaluationsController:", error)
        res.status(500).json(errorResponse("Failed to get co-evaluations"))
    }
}
