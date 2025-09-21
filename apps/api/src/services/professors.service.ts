import { supabase } from "../lib/supabase.js"
import type { PeerReview } from "@ueb/types"

export const addPeerReview = async (peerReview: PeerReview & { admin: string }): Promise<PeerReview | null> => {
    try {
        const { data, error } = await supabase
            .from("co_evaluation")
            .insert({
                professor_id: peerReview.professor,
                subject_id: peerReview.subject,
                admin_id: peerReview.admin,
                findings: peerReview.findings,
                improvement_plan: peerReview.comments,
            })
            .select()
            .single()
        if (error) {
            throw new Error(`Error adding peer review: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error adding peer review:", error)
        return null
    }
}

export const getPeerReviews = async (professorId: string): Promise<PeerReview[]> => {
    try {
        const { data, error } = await supabase
            .from("co_evaluation")
            .select(
                `
            id,
            findings,
            improvement_plan,
            created_at
        `,
            )
            .eq("professor_id", professorId)
        if (error) {
            throw new Error(`Error fetching peer reviews: ${error.message}`)
        }
        return data as any
    } catch (error) {
        console.error("Error fetching peer reviews:", error)
        return []
    }
}

export const getPeerReviewById = async (professorId: string, reviewId: string): Promise<PeerReview | null> => {
    try {
        const { data, error } = await supabase
            .from("co_evaluation")
            .select(
                `
                id,
                findings,
                improvement_plan,
                created_at
            `,
            )
            .eq("professor_id", professorId)
            .eq("id", reviewId)
            .single()
        if (error) {
            throw new Error(`Error fetching peer review: ${error.message}`)
        }
        return data as any
    } catch {
        return null
    }
}

export const updatePeerReview = async (reviewId: string, updates: Partial<PeerReview>): Promise<PeerReview | null> => {
    try {
        const { data, error } = await supabase
            .from("co_evaluation")
            .update({
                findings: updates.findings,
                improvement_plan: updates.comments,
            })
            .eq("id", reviewId)
            .select()
            .single()
        if (error) {
            throw new Error(`Error updating peer review: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error updating peer review:", error)
        return null
    }
}

export const deletePeerReview = async (reviewId: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from("co_evaluation").delete().eq("id", reviewId)
        if (error) {
            throw new Error(`Error deleting peer review: ${error.message}`)
        }
        return true
    } catch (error) {
        console.error("Error deleting peer review:", error)
        return false
    }
}
