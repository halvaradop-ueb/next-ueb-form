import { Request, Response } from "express"
import { APIResponse } from "../lib/types.js"
import { errorResponse } from "../lib/utils.js"
import { addStage, deleteStage, getStages, updateStage } from "../services/stages.service.js"

export const getStagesController = async (_: Request, res: Response<APIResponse>) => {
    try {
        const stages = await getStages()
        res.json({
            data: stages,
            errors: null,
            message: "Stages retrieved successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to retrieve stages"))
    }
}

export const createStageController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const stage = await addStage(req.body)
        res.status(201).json({
            data: stage,
            errors: null,
            message: "Stage created successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to create stage"))
    }
}

export const updateStageController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const id = req.params.id
        if (!id) {
            res.status(400).json(errorResponse("Bad request"))
            return
        }
        const stage = await updateStage(id, req.body)
        res.status(200).json({
            data: stage,
            errors: null,
            message: "Stage updated successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to update stage"))
    }
}

export const deleteStageController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const id = req.params.id
        if (!id) {
            res.status(400).json(errorResponse("Bad request"))
            return
        }
        const stage = await deleteStage(id)
        res.status(200).json({
            data: stage,
            errors: null,
            message: "Stage deleted successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to delete stage"))
    }
}
