import { StageService } from "@/lib/@types/services"

/**
 * @experimental
 */
const ROUTE = "http://localhost:4000/api/v1"

export const getStages = async (): Promise<StageService[]> => {
    try {
        const response = await fetch(`${ROUTE}/stages`)
        if (!response.ok) {
            throw new Error("Failed to fetch stages")
        }
        return response.json()
    } catch (error) {
        console.error("Error fetching stages:", error)
        return []
    }
}

export const addStage = async (stage: StageService): Promise<StageService | null> => {
    const { name, description, target_audience } = stage
    try {
        const response = await fetch(`${ROUTE}/stages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, description, target_audience }),
        })
        if (!response.ok) {
            throw new Error("Failed to add stage")
        }
        return response.json()
    } catch (error) {
        console.error("Error adding stage:", error)
        return null
    }
}

export const updateStage = async (stage: StageService): Promise<StageService | null> => {
    const { id, name, description, target_audience } = stage
    try {
        const response = await fetch(`${ROUTE}/stages`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, name, description, target_audience }),
        })
        if (!response.ok) {
            throw new Error("Failed to update stage")
        }
        return response.json()
    } catch (error) {
        console.error("Error updating stage:", error)
        return null
    }
}

export const deleteStage = async (stageId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${ROUTE}/stages/${stageId}`, {
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
