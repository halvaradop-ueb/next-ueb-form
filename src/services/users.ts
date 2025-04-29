import { supabase } from "@/lib/supabase/client"
import type { UserService } from "@/lib/@types/services"

export const getUsers = async (): Promise<UserService[]> => {
    try {
        const { data: users, error } = await supabase.from("User").select("*")

        if (error) {
            throw new Error(`Error fetching users: ${error.message}`)
        }
        return users
    } catch (error) {
        console.error("Error fetching users:", error)
        return []
    }
}
