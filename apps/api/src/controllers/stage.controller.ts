import { Request, Response } from "express"
import { addStage, deleteStage, getStages, updateStage } from "../services/stages.service.js"

export const getStagesController = async (_: Request, res: Response) => {
    try {
        const stages = await getStages()
        res.json(stages)
    } catch {
        res.status(500).json({ error: "Internal server error" })
    }
}

export const createStageController = async (req: Request, res: Response) => {
    try {
        const stage = await addStage(req.body)
        res.status(201).json(stage)
    } catch {
        res.status(500).json({ error: "Internal server error" })
    }
}

export const updateStageController = async (req: Request, res: Response) => {
    try {
        const stage = await updateStage(req.body)
        res.status(200).json(stage)
    } catch {
        res.status(500).json({ error: "Internal server error" })
    }
}

export const deleteStageController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        if (!id) {
            res.status(400).json({ error: "Bad request" })
            return
        }
        const stage = await deleteStage(id)
        res.status(200).json(stage)
    } catch {
        res.status(500).json({ error: "Internal server error" })
    }
}
