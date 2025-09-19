import { StageService } from "@/lib/@types/services"
import { createRequest, createService } from "./utils"

export const getStages = async (): Promise<StageService[]> => {
    // In production, use Next.js API routes
    if (process.env.NODE_ENV === "production") {
        try {
            const response = await fetch("/api/stages")
            if (!response.ok) {
                throw new Error(`Error fetching stages: ${response.statusText}`)
            }
            const json = await response.json()
            return json.data || []
        } catch (error) {
            console.error("Error fetching stages:", error)
            return []
        }
    }

    // In development, use the Express API
    const request = createRequest("GET", "stages")
    const result = await createService(request)
    return result || []
}

export const addStage = async (stage: StageService): Promise<StageService | null> => {
    const { name, description, target_audience } = stage
    const request = createRequest("POST", "stages", { name, description, target_audience })
    return createService(request)
}

export const updateStage = async (stage: StageService): Promise<StageService | null> => {
    const { id, name, description, target_audience } = stage
    const request = createRequest("PUT", `stages/${id}`, { name, description, target_audience })
    return createService(request)
}

export const deleteStage = async (stageId: string): Promise<boolean> => {
    const request = createRequest("DELETE", `stages/${stageId}`)
    return createService(request)
}
