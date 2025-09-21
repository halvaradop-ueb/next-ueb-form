import { supabase } from "../lib/supabase.js"
import { hashPassword } from "./auth.service.js"
import { User } from "@ueb/types/user"

export async function getUsers() {
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

export async function getUserById(userId: string): Promise<User | null> {
    try {
        const { data, error } = await supabase.from("User").select("*").eq("id", userId).single()
        if (error) return null
        return data as User
    } catch (error) {
        console.error("Error fetching user by ID:", error)
        return null
    }
}

export async function createUser(user: User): Promise<User | null> {
    try {
        const { password, id, created_at, ...spread } = user
        const hashedPassword = await hashPassword(password)
        const { data, error } = await supabase
            .from("User")
            .insert({ ...spread, password: hashedPassword })
            .select()
            .single()
        if (error) {
            throw new Error(`Error adding user: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error adding user:", error)
        return null
    }
}

export const updateUserPassword = async (userId: string, newPassword: string): Promise<User | null> => {
    try {
        const hashedPassword = await hashPassword(newPassword)
        const { data, error } = await supabase
            .from("User")
            .update({ password: hashedPassword })
            .eq("id", userId)
            .select()
            .single()

        if (error) {
            throw new Error(`Error updating user password: ${error.message}`)
        }

        return data
    } catch (error) {
        console.error("Error updating user password:", error)
        return null
    }
}

export const deleteUser = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from("User").delete().eq("id", id)
        if (error) {
            throw new Error(`Error deleting user: ${error.message}`)
        }
        return true
    } catch (error) {
        console.error("Error deleting user:", error)
        return false
    }
}

export const updateUser = async (user: User): Promise<User | null> => {
    try {
        const { password, ...userWithoutPassword } = user
        const { data, error } = await supabase
            .from("User")
            .update(userWithoutPassword)
            .eq("id", user.id)
            .select()
            .single()

        if (error) {
            throw new Error(`Error updating user: ${error.message}`)
        }
        return data
    } catch (error) {
        console.error("Error updating user:", error)
        return null
    }
}

export const uploadUserPhoto = async (file: any, userId: string) => {
    const fileExt = file.originalname.split(".").pop()
    const filePath = `${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from("avatars").upload(filePath, file.buffer, {
        cacheControl: "3600",
        upsert: true,
    })

    if (error) {
        console.error("Error uploading image:", error.message)
        return null
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

    return data.publicUrl
}
