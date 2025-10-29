import { hashPassword } from "@/services/auth"
import type { User } from "@ueb/types"
import { supabase } from "./supabase/client"

const users: Partial<User>[] = [
    {
        id: "admin-id",
        first_name: "Admin",
        last_name: "User",
        email: "admin@example.com",
        password: await hashPassword("123"),
        role: "admin",
        status: true,
        address: "",
        phone: "",
    },
    {
        id: "professor-id",
        first_name: "Professor",
        last_name: "User",
        email: "professor@example.com",
        password: await hashPassword("123"),
        role: "professor",
        status: true,
        address: "",
        phone: "",
    },
]

export const seedUsers = async () => {
    const usrs = await supabase.from("User").select("*")
    for (const user of users) {
        const { data, error } = await supabase.from("User").select("*").eq("email", user.email).single()
        if (error || !data) {
            const { error } = await supabase.from("User").insert(user)
            if (error) {
                console.error("Error seeding user:", error)
            }
        }
    }
}
