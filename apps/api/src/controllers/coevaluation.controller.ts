import { Request, Response } from "express"
import { errorResponse } from "../lib/utils.js"
import { getAllCoEvaluations } from "../services/coevaluation.service.js"

export const getAllCoEvaluationsController = async (_req: Request, res: Response) => {
    try {
        const coEvaluations = await getAllCoEvaluations()
        if (!coEvaluations) {
            return res.status(404).json(errorResponse("No co-evaluations found"))
        }
        res.json(coEvaluations)
    } catch {
        res.status(500).json(errorResponse("Failed to get co-evaluations"))
    }
}
