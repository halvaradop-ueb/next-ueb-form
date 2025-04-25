"use server"
import { signIn, signOut } from "@/auth"
import { FormState } from "@/lib/@types/types"
import { LoginSchema } from "../schema"
import { redirect } from "next/navigation"

export const loginAction = async (previous: FormState, form: FormData): Promise<FormState> => {
    const entries = Object.fromEntries(form.entries())
    const isAuthenticated = LoginSchema.safeParse(entries)
    if (!isAuthenticated.success) {
        return {
            idle: "error",
            message: isAuthenticated.error.format().email?._errors[0] || "Invalid email or password",
        }
    }
    try {
        await signIn("credentials", form)
    } catch (error) {
        return {
            idle: "error",
            message: "Invalid email or password",
        }
    }
    redirect("/dashboard")
    return {
        idle: "success",
        message: "Login successful",
    }
}

export const signInWithGoogle = async () => {
    await signIn("google")
}

export const signOutSession = async () => {
    await signOut({ redirectTo: "/auth" })
}
