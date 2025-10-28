"use client"
import { useActionState, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { loginAction, signInWithOutlook } from "@/lib/actions/login"
import type { FormState } from "@/lib/@types/types"

const AuthPage = () => {
    const [state, action, isPending] = useActionState<FormState, FormData>(loginAction, {
        idle: "idle",
        message: "",
    })
    const [userType, setUserType] = useState<string>("")

    return (
        <section className="min-h-dvh flex items-center justify-center">
            <Card className="w-11/12 max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
                    <CardDescription>
                        Bienvenido al sistema de evaluación docente. Por favor, selecciona si ingresarás como
                        docente/administrador o como estudiante.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="userType">Seleciona Tu Rol</Label>
                            <Select onValueChange={setUserType} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tu tipo de usuario" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Estudiante</SelectItem>
                                    <SelectItem value="admin">Admin/Docente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {userType === "admin" && (
                            <form action={action} id="credentials-form">
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Correo electrónico</Label>
                                        <Input type="email" id="email" name="email" placeholder="m@ejemplo.com" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Contraseña</Label>
                                        </div>
                                        <Input type="password" id="password" name="password" placeholder="******" required />
                                    </div>
                                    {state.idle === "error" && (
                                        <span className="w-full py-2 text-center text-red-100  rounded-md bg-red-400">
                                            {state.message}
                                        </span>
                                    )}
                                    <Button type="submit" className="w-full hover:cursor-pointer" disabled={isPending}>
                                        Iniciar sesión (Admin/Docente)
                                    </Button>
                                </div>
                            </form>
                        )}
                        {userType === "student" && (
                            <form action={signInWithOutlook}>
                                <Button className="w-full hover:cursor-pointer" variant="outline" disabled={isPending}>
                                    Iniciar sesión con Outlook (Estudiantes)
                                </Button>
                            </form>
                        )}
                    </div>
                </CardContent>
            </Card>
        </section>
    )
}

export default AuthPage
