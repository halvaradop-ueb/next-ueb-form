import { supabase } from "../lib/supabase.js"

export interface QuestionService {
    id: string
    title: string
    description?: string
    question_type: "single_choice" | "multiple_choice" | "text" | "numeric"
    required: boolean
    target_audience: "student" | "professor"
    stage_id: string
}

export interface StageService {
    id: string
    name: string
    description: string
    target_audience: "student" | "professor"
    questions: Pick<QuestionService, "id" | "title" | "description">[]
}

export const getStages = async (): Promise<StageService[]> => {
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
        })) as unknown as StageService[]
    } catch (error) {
        console.error("Error fetching stages:", error)
        return []
    }
}

export const addStage = async (stage: StageService): Promise<StageService | null> => {
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

        return { ...data, questions: [] } as StageService
    } catch (error) {
        console.error("Error adding stage:", error)
        return null
    }
}

export const updateStage = async (stage: StageService): Promise<StageService | null> => {
    const { id, name, description, target_audience } = stage
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
            `,
            )
            .single()
        if (error) {
            throw new Error(`Error updating stage: ${error.message}`)
        }

        return { ...data, questions: data.question } as unknown as StageService
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
