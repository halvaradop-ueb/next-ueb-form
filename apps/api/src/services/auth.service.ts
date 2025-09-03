import { supabase } from "../lib/supabase.js"
import { hash, genSalt, compare } from "bcryptjs"
import crypto from "crypto"

export async function authenticate(email: string, password: string): Promise<any | null> {
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()
    if (error || !data) {
        console.error("Error fetching user:", error)
        return null
    }
    const isAuthenticated = await compare(password, data.password)
    return isAuthenticated ? data : null
}

export function getRandomPassword(length: number = 16) {
    return crypto.randomBytes(length).toString("base64")
}

export async function hashPassword(password: string): Promise<string> {
    const salt = await genSalt(10)
    return await hash(password, salt)
}

export async function checkAndRegisterUser(profile: any): Promise<any | null> {
    const { email } = profile
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()
    if (error || !data) {
        const randomPassword = getRandomPassword()
        const password = await hashPassword(randomPassword)
        const { data: newUser, error: createError } = await supabase
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
        if (createError) {
            console.error("Error creating user:", createError)
            return null
        }
        return newUser
    }
    return data
}
