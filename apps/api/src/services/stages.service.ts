import { supabase } from "../lib/supabase.js"
import { Stage } from "@ueb/types/stage"

export const getStages = async (): Promise<Stage[]> => {
    try {
        const { data, error } = await supabase.from("stage").select(`
                id,
                name,
                description,
                target_audience,
                question (
                    id,
                    title,
                    description
                )        
            `)
        if (error) {
            throw new Error(`Error fetching stages: ${error.message}`)
        }
        return data.map((state) => ({
            ...state,
            questions: state.question,
        })) as unknown as Stage[]
    } catch (error) {
        console.error("Error fetching stages:", error)
        return []
    }
}

export const addStage = async (stage: Stage): Promise<Stage | null> => {
    const { name, description, target_audience } = stage
    try {
        const { data, error } = await supabase
            .from("stage")
            .insert({ name: name.trim(), description, target_audience })
            .select()
            .single()
        if (error) {
            throw new Error(`Error adding stage: ${error.message}`)
        }

        return { ...data, questions: [] } as Stage
    } catch (error) {
        console.error("Error adding stage:", error)
        return null
    }
}

export const updateStage = async (id: string, stage: Stage): Promise<Stage | null> => {
    const { name, description, target_audience } = stage
    try {
        const { data, error } = await supabase
            .from("stage")
            .update({ name, description, target_audience })
            .eq("id", id)
            .select(
                `
                id,
                name,
                description,
                target_audience,
                question (
                    id,
                    title,
                    description
                )    
            `
            )
            .single()
        if (error) {
            throw new Error(`Error updating stage: ${error.message}`)
        }

        return { ...data, questions: data.question } as unknown as Stage
    } catch (error) {
        console.error("Error updating stage:", error)
        return null
    }
}

export const deleteStage = async (stageId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from("stage").delete().eq("id", stageId)
        if (error) {
            throw new Error(`Error deleting stage: ${error.message}`)
        }
        return true
    } catch (error) {
        console.error("Error deleting stage:", error)
        return false
    }
}
