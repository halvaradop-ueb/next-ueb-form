import { Request, Response } from "express"
import { errorResponse } from "../lib/utils.js"
import { APIResponse } from "../lib/types.js"
import { getAllCoEvaluations } from "../services/coevaluation.service.js"

export const getAllCoEvaluationsController = async (_req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const coEvaluations = await getAllCoEvaluations()
        if (!coEvaluations) {
            return res.status(404).json(errorResponse("No co-evaluations found"))
        }
        res.json({
            data: coEvaluations,
            errors: null,
            message: "Co-evaluations retrieved successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to get co-evaluations"))
    }
}
