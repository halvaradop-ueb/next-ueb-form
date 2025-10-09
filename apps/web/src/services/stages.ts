import { StageService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"

export const getStages = async (): Promise<StageService[]> => {
    const request = createRequest("GET", "stages")
    const response = await createService(request)
    return response?.data || []
}

export const addStage = async (stage: StageService): Promise<StageService | null> => {
    const { name, description, target_audience } = stage
    const request = createRequest("POST", "stages", { name, description, target_audience })
    const service = await createService(request)
    return service.data
}

export const updateStage = async (stage: StageService): Promise<StageService | null> => {
    const { id, name, description, target_audience } = stage
    const request = createRequest("PUT", `stages/${id}`, { name, description, target_audience })
    const service = await createService(request)
    return service.data
}

export const deleteStage = async (stageId: string): Promise<boolean> => {
    const request = createRequest("DELETE", `stages/${stageId}`)
    return createService(request)
}
