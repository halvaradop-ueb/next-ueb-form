"use client"
import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loginAction, signInWithGoogle } from "@/lib/actions/login"
import { FormState } from "@/lib/@types/types"

const AuthPage = () => {
    const [state, action, isPending] = useActionState<FormState, FormData>(loginAction, {
        idle: "idle",
        message: "",
    })

    return (
        <section className="min-h-dvh flex items-center justify-center">
            <Card className="w-11/12 max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>Enter your email below to login to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={action}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input type="email" id="email" name="email" placeholder="m@example.com" required />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input type="password" id="password" name="password" placeholder="******" required />
                            </div>
                            {state.idle === "error" && (
                                <span className="w-full py-2 text-center text-red-100  rounded-md bg-red-400">
                                    {state.message}
                                </span>
                            )}
                            <Button type="submit" className="w-full hover:cursor-pointer" disabled={isPending}>
                                Login
                            </Button>
                        </div>
                    </form>
                    <form action={signInWithGoogle}>
                        <Button className="w-full mt-6 hover:cursor-pointer" variant="outline" disabled={isPending}>
                            Login with Google
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </section>
    )
}

export default AuthPage
