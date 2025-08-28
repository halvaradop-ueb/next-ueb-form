import { Session } from "next-auth"
import { hashPassword } from "./auth"
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

export const addUser = async (user: Omit<UserService, "created_at" | "id">): Promise<UserService | null> => {
    try {
        const { password, ...spread } = user
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

export const updateUser = async (user: UserService): Promise<UserService | null> => {
    try {
        const { data, error } = await supabase.from("User").update(user).eq("id", user.id).select().single()
        if (error) {
            throw new Error(`Error updating user: ${error.message}`)
        }
        if (data.password === user.password) {
            const hashedPassword = await hashPassword(user.password)
            const { data: updatedData, error: updateError } = await supabase
                .from("User")
                .update({ password: hashedPassword })
                .eq("id", user.id)
                .select()
                .single()
            if (updateError) {
                throw new Error(`Error updating user password: ${updateError.message}`)
            }
            return updatedData
        }
        return data
    } catch (error) {
        console.error("Error updating user:", error)
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

export const getAuthenticated = async (session: Session): Promise<UserService | null> => {
    try {
        if (!session || !session.user) {
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