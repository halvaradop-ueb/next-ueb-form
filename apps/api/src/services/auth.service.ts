import { supabase } from "../lib/supabase.js"
import { hash, genSalt, compare } from "bcryptjs"

export type User = {
    id: string
    email: string
    password: string
    role: string
    status: boolean
    first_name: string
    last_name: string
}

export type SafeUser = Omit<User, "password">

export async function authenticate(email: string, password: string): Promise<SafeUser | null> {
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()

    if (error || !data) {
        console.error("Error fetching user:", error)
        return null
    }

    const user = data as User

    const isAuthenticated = await compare(password, user.password)
    if (!isAuthenticated) return null

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
}

export function getRandomPassword(length: number = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function hashPassword(password: string): Promise<string> {
    const salt = await genSalt(10)
    return await hash(password, salt)
}

export async function checkAndRegisterUser(profile: { email: string }): Promise<SafeUser | null> {
    const { email } = profile
    const { data, error } = await supabase.from("User").select("*").eq("email", email).single()

    const user = data as User | undefined

    if (!user || error) {
        const randomPassword = getRandomPassword()
        const hashedPassword = await hashPassword(randomPassword)

        const { data: newUser, error: createError } = await supabase
            .from("User")
            .insert({
                email,
                password: hashedPassword,
                role: "student",
                status: true,
                first_name: "unknown",
                last_name: "unknown",
            })
            .select()
            .single()

        if (createError || !newUser) {
            console.error("Error creating user:", createError)
            return null
        }

        return newUser as SafeUser
    }

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
}
