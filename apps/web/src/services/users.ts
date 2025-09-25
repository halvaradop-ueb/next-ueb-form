import type { Session } from "next-auth"
import type { User } from "@ueb/types/user"
import { createService, createRequest } from "./utils"
import { supabase } from "@/lib/supabase/client"

export const getUsers = async (): Promise<User[]> => {
    const request = createRequest("GET", "users")
    const response = await createService(request)
    return response?.data || []
}

export const addUser = async (user: Omit<User, "created_at" | "id">): Promise<User | null> => {
    const request = createRequest("POST", "users", user)
    return await createService(request)
}

export const updateUser = async (user: User): Promise<User | null> => {
    const request = createRequest("PUT", `users/${user.id}`, user)
    return await createService(request)
}

export const updateUserPassword = async (userId: string, password: string): Promise<User | null> => {
    const request = createRequest("PUT", `users/${userId}/password`, { password })
    return await createService(request)
}

export const deleteUser = async (id: string): Promise<boolean> => {
    const request = createRequest("DELETE", `users/${id}`)
    const response = await createService(request)
    return !!response
}

export const getUserById = async (session: Session): Promise<User | null> => {
    if (!session.user?.id) return null
    const request = createRequest("GET", `users/${session.user.id}`)
    return await createService(request)
}

export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
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

export const uploadUserPhoto = uploadAvatar
