import { StageService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"

export const getStages = async (): Promise<StageService[]> => {
    const request = createRequest("GET", "/stages")
    return createService(request)
}

export const addStage = async (stage: StageService): Promise<StageService | null> => {
    const { name, description, target_audience } = stage
    const request = createRequest("POST", "/stages", { name, description, target_audience })
    return createService(request)
}

export const updateStage = async (stage: StageService): Promise<StageService | null> => {
    const { id, name, description, target_audience } = stage
    const request = createRequest("PUT", `/stages/${id}`, { name, description, target_audience })
    return createService(request)
}

export const deleteStage = async (stageId: string): Promise<boolean> => {
    const request = createRequest("DELETE", `/stages/${stageId}`)
    return createService(request)
}
