import { supabase } from "../lib/supabase.js"

export const getAllCoEvaluations = async () => {
    try {
        const { data, error } = await supabase.from("co_evaluation").select(`
            id,
            findings,
            improvement_plan,
            created_at,
            subject:subject_id (id, name, description),
            professor:professor_id (id, first_name, last_name, email),
            admin:admin_id (id, first_name, last_name, email)
        `)
        if (error) {
            throw new Error(`Error fetching co-evaluations: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error fetching co-evaluations:", error)
        return []
    }
}
