import { supabase } from "@/lib/supabase/client"
import { UserService } from "@/lib/@types/services"
import type { OAuthProfile } from "@/lib/@types/types"
import { hash, genSalt, compare } from "bcryptjs"

export const authenticate = async (email: string, password: string): Promise<UserService | null> => {
    console.log("Authenticating user:", email)
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()
    if (error) {
        console.error("Error fetching user:", error)
        return null
    }
    if (!data) {
        console.log("User not found:", email)
        return null
    }
    console.log("User found, comparing password")
    const isAuthenticated = await compare(password, data.password)
    console.log("Password match:", isAuthenticated)
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

export const checkAndRegisterUser = async (profile: OAuthProfile): Promise<UserService | null> => {
    const { email } = profile
    console.log("Checking user for registration:", email)
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()
    if (error) {
        console.log("User not found, creating new user")
        const fixedPassword = "student123"
        const password = await hashPassword(fixedPassword)
        console.log("Hashed password for new user")
        console.log("Inserting new user with email:", email)
        const { data: newUser, error } = await supabase
            .from("User")
            .insert({
                email,
                password,
                role: "student",
                status: true,
                first_name: "UNKNOWN",
                last_name: "UNKNOWN",
                address: "",
                phone: "",
            })
            .select()
            .single()
        if (error) {
            console.error("Error creating user:", error)
            return null
        }
        console.log("User created successfully:", newUser.email)
        return newUser
    }
    console.log("User already exists:", data.email)
    return data
}
