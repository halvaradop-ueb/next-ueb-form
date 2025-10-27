import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authenticate, checkAndRegisterUser } from "@/services/auth"

export const { auth, handlers, signIn, signOut } = NextAuth({
    basePath: "/auth",
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                const { email, password } = credentials
                const isAuthenticated = await authenticate(email as string, password as string)
                if (!isAuthenticated) {
                    return null
                }
                return {
                    id: isAuthenticated.id,
                    name: `${isAuthenticated.first_name} ${isAuthenticated.last_name}`,
                    email: isAuthenticated.email,
                    role: isAuthenticated.role,
                }
            },
        }),
        {
            id: "outlook",
            name: "Microsoft",
            type: "oidc",
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
            clientId: process.env.AZURE_CLIENT_ID,
            clientSecret: process.env.AZURE_CLIENT_SECRET,
            checks: ["none"],
            authorization: {
                params: {
                    scope: "openid profile email https://graph.microsoft.com/User.Read",
                },
            },
            async profile(profile: any) {
                console.log("Outlook profile received:", profile)
                const email = profile.email || "student@example.com"
                console.log("Processing email:", email)
                const newUser = await checkAndRegisterUser({ email })
                if (!newUser) {
                    console.error("Failed to create or find user for email:", email)
                    throw new Error("Error creating user")
                }
                console.log("User processed successfully:", newUser.email)
                return {
                    id: newUser.id,
                    role: "student",
                    email: email,
                    name: profile.name || "Student",
                } as User
            },
        },
    ],
    callbacks: {
        async jwt({ user, token }) {
            if (user?.role) {
                token.role = user.role
            }
            if (user?.id) {
                token.id = user.id
            }
            return { ...token }
        },
        async session({ session, token }) {
            if (token?.role) {
                session.user.role = token.role
            }
            if (token?.id) {
                session.user.id = token.id
            }
            return { ...session }
        },
    },
})
