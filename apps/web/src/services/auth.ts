import { supabase } from "@/lib/supabase/client"
import type { GoogleProfile } from "@/lib/@types/types"
import type { User } from "@ueb/types"
import { hash, genSalt, compare } from "bcryptjs"

export const authenticate = async (email: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()
    if (!data) return null
    const isAuthenticated = await compare(password, data.password)
    if (error) {
        console.error("Error fetching user:", error)
        return null
    }
    return isAuthenticated ? data : null
}

export const getRandomPassword = (length: number = 16) => {
    const bytes = crypto.getRandomValues(new Uint8Array(length)).toString()
    return Buffer.from(bytes).toString("base64")
}

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await genSalt(10)
    return await hash(password, salt)
}

export const checkAndRegisterUser = async (profile: GoogleProfile): Promise<User | null> => {
    const { email } = profile
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()
    if (error) {
        const randomPassword = getRandomPassword()
        const password = await hashPassword(randomPassword)
        const { data: newUser, error } = await supabase
            .from("User")
            .insert({
                email,
                password,
                role: "student",
                status: true,
                first_name: "unknown",
                last_name: "unknown",
            })
            .select()
            .single()
        if (error) {
            console.error("Error creating user:", error)
            return null
        }
        return newUser
    }
    return data
}
