import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authenticate } from "@/services/users"

export const { auth, handlers, signIn, signOut } = NextAuth({
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
                    password: isAuthenticated.password,
                    role: isAuthenticated.role,
                } as User
            },
        }),
        Google,
    ],
    callbacks: {
        async jwt({ user, token }) {
            if (user) {
                token.role = user.role
                token.id = user.id as string
            }
            return { ...token }
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role
                session.user.id = token.id
            }
            return { ...session }
        },
    },
})
