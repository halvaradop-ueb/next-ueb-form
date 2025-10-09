import NextAuth, { User } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { authenticate, checkAndRegisterUser } from "@/services/auth"
import { GoogleProfile } from "./@types/types"

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
                    role: isAuthenticated.role,
                }
            },
        }),
        Google({
            async profile(profile) {
                const newUser = await checkAndRegisterUser(profile as GoogleProfile)
                if (!newUser) {
                    throw new Error("Error creating user")
                }
                return {
                    id: newUser.id,
                    role: "student",
                    /**
                     * TODO: Check if this is correct
                     * May be undefined in the future
                     */
                    email: profile.email,
                    name: "unknown",
                } as User
            },
        }),
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
