import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/lib/auth"
import { checkAndRegisterUser } from "@/services/auth"
import type { OAuthProfile } from "@/lib/@types/types"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    console.log("Outlook callback received:", { code: !!code, state })

    if (!code) {
        return NextResponse.json({ error: "Authorization code missing" }, { status: 400 })
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: process.env.AZURE_CLIENT_ID!,
                client_secret: process.env.AZURE_CLIENT_SECRET!,
                code,
                grant_type: "authorization_code",
                redirect_uri: `${process.env.NEXTAUTH_URL}/auth/callback/outlook`,
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json()
            console.error("Token exchange failed:", errorData)
            return NextResponse.json(
                { error: `Failed to exchange token: ${errorData.error_description || errorData.error}` },
                { status: 500 }
            )
        }

        const tokenData = await tokenResponse.json()
        console.log("Token exchange successful:", { access_token: !!tokenData.access_token })
        const accessToken = tokenData.access_token

        // Get user info from Microsoft Graph
        const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!userResponse.ok) {
            const errorData = await userResponse.json()
            console.error("Failed to fetch user info:", errorData)
            return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 })
        }

        const userData = await userResponse.json()
        console.log("User info fetched:", { email: userData.mail || userData.userPrincipalName, name: userData.displayName })
        const email = userData.mail || userData.userPrincipalName
        const name = userData.displayName

        if (!email) {
            return NextResponse.json({ error: "Email not found in user profile" }, { status: 400 })
        }

        // Register or get user
        const profile: OAuthProfile = { email, name }
        console.log("Registering user with profile:", profile)
        const newUser = await checkAndRegisterUser(profile)

        if (!newUser) {
            return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
        }

        console.log("User registered successfully:", newUser.email)

        // Sign in with the registered user
        console.log("Attempting to sign in user:", newUser.email)
        await signIn("credentials", {
            email: newUser.email,
            password: "student123", // Fixed password from the service
            redirect: false,
        })

        console.log("Sign in successful, redirecting to dashboard")

        // Redirect to student dashboard
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
    } catch (error) {
        console.error("Error in Outlook callback:", error)
        console.error("Error details:", error instanceof Error ? error.message : error)
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        )
    }
}
