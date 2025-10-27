"use server"
import { signIn, signOut } from "@/auth"
import { FormState } from "@/lib/@types/types"
import { LoginSchema } from "../schema"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { AuthError } from "next-auth"

// @eslint-ignore
export const loginAction = async (_: FormState, form: FormData): Promise<FormState> => {
    const entries = Object.fromEntries(form.entries())
    const isAuthenticated = LoginSchema.safeParse(entries)
    if (!isAuthenticated.success) {
        return {
            idle: "error",
            message: isAuthenticated.error.format().email?._errors[0] || "Invalid email or password",
        }
    }
    try {
        await signIn("credentials", entries)
    } catch (error) {
        if (error instanceof AuthError) {
            return {
                idle: "error",
                message: "Invalid email or password",
            }
        } else if (isRedirectError(error)) {
            redirect("/dashboard")
        }
        return {
            idle: "error",
            message: "Invalid email or password",
        }
    }
    return {
        idle: "success",
        message: "Login successful",
    }
}

export const signInWithOutlook = async () => {
    await signIn("outlook")
}

export const signInWithOutlook = async () => {
    await signIn("outlook")
}

export const signOutSession = async () => {
    await signOut({ redirectTo: "/auth" })
}
