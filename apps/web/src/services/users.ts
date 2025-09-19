import { Session } from "next-auth"
import type { User } from "@ueb/types/user"
import { supabase } from "@/lib/supabase/client"
import { createService, createRequest } from "./utils"

export const getUsers = async (): Promise<User[]> => {
    // In production, use Next.js API routes
    if (process.env.NODE_ENV === "production") {
        const response = await fetch("/api/users")
        if (!response.ok) {
            throw new Error(`Error fetching users: ${response.statusText}`)
        }
        const json = await response.json()
        return json.data || []
    }

    // In development, use the Express API
    const request = createRequest("GET", "users")
    const result = await createService(request)
    return result || []
}

export const addUser = async (user: Omit<User, "created_at" | "id">): Promise<User | null> => {
    const request = createRequest("POST", "users", user)
    return createService(request)
}

export const updateUser = async (user: User): Promise<User | null> => {
    const request = createRequest("PUT", `users/${user.id}`, user)
    return createService(request)
}

export const updateUserPassword = async (userId: string, newPassword: string): Promise<User | null> => {
    const request = createRequest("PUT", `users/${userId}/password`, { password: newPassword })
    return createService(request)
}

export const deleteUser = async (id: string): Promise<boolean> => {
    const request = createRequest("DELETE", `users/${id}`)
    const response = await createService(request)
    return !!response
}

export const getUserById = async (session: Session): Promise<User | null> => {
    if (!session.user?.id) return null
    const request = createRequest("GET", `users/${session.user.id}`)
    return createService(request)
}

/**
 * todo: move to API
 * @deprecated
 * @unstable
 */
export const uploadUserPhoto = async (file: File, userId: string) => {
    const fileExt = file.name.split(".").pop()
    const filePath = `${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
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
