import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

const users = [
    {
        name: "Jane Doe",
        email: "jane@gmail.com",
        password: "password",
        role: "student",
    },
    {
        name: "John Doe",
        email: "johndoe@gmail.com",
        password: "password",
        role: "proffessor",
    },
    {
        name: "Admin",
        email: "admin@gmail.com",
        password: "admin",
        role: "admin",
    },
]

export const { auth, handlers, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials) => {
                const isAuthenticated = users.find((user) => {
                    return user.email === credentials?.email && user.password === credentials?.password
                })
                if (!isAuthenticated) {
                    return null
                }
                return {
                    name: isAuthenticated.name,
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
            }
            return { ...token }
        },
        async session({ session, token }) {
            if (token) {
                session.user.role = token.role
            }
            return { ...session }
        },
    },
})
