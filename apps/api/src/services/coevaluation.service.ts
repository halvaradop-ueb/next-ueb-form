import { supabase } from "../lib/supabase.js"

export const getAllCoEvaluations = async (professorId?: string, subjectId?: string) => {
    try {
        let query = supabase.from("co_evaluation").select(`
                id,
                professor_id,
                subject_id,
                findings,
                improvement_plan,
                created_at,
                subject:subject_id (id, name, description),
                professor:professor_id (id, first_name, last_name, email),
                admin:admin_id (id, first_name, last_name, email)
            `)

        if (professorId) {
            query = query.eq("professor_id", professorId)
        }
        if (subjectId) {
            query = query.eq("subject_id", subjectId)
        }

        const { data, error } = await query

        if (error) {
            console.error("❌ [API] Supabase error:", error)
            throw new Error(`Error fetching co-evaluations: ${error.message}`)
        }

        return data || []
    } catch (error) {
        console.error("Error fetching co-evaluations:", error)
        return []
    }
}
