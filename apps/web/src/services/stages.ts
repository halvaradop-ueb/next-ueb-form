import { StageService } from "@/lib/@types/services"
import { API_ENDPOINT } from "./utils"

export const getStages = async (): Promise<StageService[]> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/stages`)
        if (!response.ok) {
            throw new Error("Failed to fetch stages")
        }
        const json = await response.json()
        return json.data
    } catch (error) {
        console.error("Error fetching stages:", error)
        return []
    }
}

export const addStage = async (stage: StageService): Promise<StageService | null> => {
    const { name, description, target_audience } = stage
    try {
        const response = await fetch(`${API_ENDPOINT}/stages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, description, target_audience }),
        })
        if (!response.ok) {
            throw new Error("Failed to add stage")
        }
        const json = await response.json()
        return json.data
    } catch (error) {
        console.error("Error adding stage:", error)
        return null
    }
}

export const updateStage = async (stage: StageService): Promise<StageService | null> => {
    const { id, name, description, target_audience } = stage
    try {
        const response = await fetch(`${API_ENDPOINT}/stages/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, description, target_audience }),
        })
        if (!response.ok) {
            throw new Error("Failed to update stage")
        }
        const json = await response.json()
        return json.data
    } catch (error) {
        console.error("Error updating stage:", error)
        return null
    }
}

export const deleteStage = async (stageId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_ENDPOINT}/stages/${stageId}`, {
            method: "DELETE",
        })
        if (!response.ok) {
            throw new Error("Failed to delete stage")
        }
        return true
    } catch (error) {
        console.error("Error deleting stage:", error)
        return false
    }
}
