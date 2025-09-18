import { Session } from "next-auth"
import type { UserService } from "@ueb/types"
import { supabase } from "@/lib/supabase/client"

const ROUTE = "http://localhost:4000/api/v1"

export const getUsers = async (): Promise<UserService[]> => {
    const response = await fetch(`${ROUTE}/users`)
    if (!response.ok) {
        throw new Error("Failed to fetch users")
    }
    const json = await response.json()
    return json.data
}

export const addUser = async (user: Omit<UserService, "created_at" | "id">): Promise<UserService | null> => {
    const response = await fetch(`${ROUTE}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    })
    if (!response.ok) {
        throw new Error("Failed to add user")
    }
    const json = await response.json()
    return json.data
}

export const updateUser = async (user: UserService): Promise<UserService | null> => {
    const response = await fetch(`${ROUTE}/users/${user.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
    })
    if (!response.ok) {
        throw new Error("Failed to update user")
    }
    const json = await response.json()
    return json.data
}

export const updateUserPassword = async (userId: string, newPassword: string): Promise<UserService | null> => {
    const response = await fetch(`${ROUTE}/users/${userId}/password`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
    })
    if (!response.ok) {
        throw new Error("Failed to update user password")
    }
    const json = await response.json()
    return json.data
}

export const deleteUser = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${ROUTE}/users/${id}`, {
            method: "DELETE",
        })
        return response.ok
    } catch {
        return false
    }
}

export const getAuthenticated = async (session: Session): Promise<UserService | null> => {
    try {
        if (!session?.user) {
            return null
        }
        const { user } = session
        const { data, error } = await supabase.from("User").select("*").eq("id", user.id).single()
        if (error) {
            console.error("Error fetching logged user:", error)
            return null
        }
        return data
    } catch (error) {
        console.error("Error fetching logged user:", error)
        return null
    }
}

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
