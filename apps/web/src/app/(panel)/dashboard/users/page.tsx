"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, UserPlus, MoreHorizontal } from "lucide-react"
import type { Role } from "@/lib/@types/types"
import type { UserService } from "@/lib/@types/services"
import { addUser, deleteUser, getUsers, updateUser, uploadUserPhoto } from "@/services/users"
import Image from "next/image"
const roles: Record<Role, string> = {
    admin: "Administrador",
    professor: "Docente",
    student: "Estudiante", // Kept for type compatibility but not used in UI
}

const initialState: UserService = {
    id: "",
    created_at: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "professor",
    status: true,
    address: "",
    phone: "",
    photo: "",
}

const UserManagementPage = () => {
    const [activeTab, setActiveTab] = useState("professor")
    const [searchQuery, setSearchQuery] = useState("")
    const [users, setUsers] = useState<UserService[]>([])
    const [idleForm, setIdleForm] = useState<"create" | "edit">("create")
    const [newUser, setNewUser] = useState<UserService>(initialState)

    const filteredUsers = users.filter(
        (user) =>
            (user.role === "professor" || user.role === "admin") &&
            user.role === activeTab &&
            (user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    const handleChange = (key: keyof UserService, value: any) => {
        setNewUser((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    const handleSetEdit = (user: UserService) => {
        setIdleForm("edit")
        setNewUser({ ...user, password: "" })
        document.getElementById("add-user-card")?.scrollIntoView({ behavior: "smooth" })
    }

    const handleSubmit = async () => {
        if (idleForm === "edit") {
            const updatedUser = await updateUser(newUser)
            setUsers((previous) => previous.map((user) => (user.id === updatedUser?.id ? updatedUser : user)))
            alert("¡Usuario actualizado exitosamente!")
        } else {
            const addNewUser = await addUser(newUser)
            if (!addNewUser) {
                alert("Error al agregar el usuario")
                return
            }
            setUsers((previous) => [...previous, addNewUser])
            alert("¡Usuario agregado exitosamente!")
        }
        setNewUser(initialState)
    }

    const handleDeleteUser = async (userId: string) => {
        deleteUser(userId)
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
        alert("¡Usuario eliminado exitosamente!")
    }

    const handleCancelEdit = () => {
        setIdleForm("create")
        setNewUser(initialState)
    }

    useEffect(() => {
        const fetchUsers = async () => {
            const users = await getUsers()
            setUsers(users)
        }
        fetchUsers()
    }, [])

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Gestión de Usuarios</h1>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="professor">Docentes</TabsTrigger>
                        <TabsTrigger value="admin">Administradores</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeTab} className="space-y-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar usuarios..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={() =>
                                    document.getElementById("add-user-card")?.scrollIntoView({ behavior: "smooth" })
                                }
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Agregar Usuario
                            </Button>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Foto</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Correo Electrónico</TableHead>
                                            <TableHead>Rol</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Última Actividad</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow
                                                className={cn({
                                                    "opacity-50": user.role === "student",
                                                })}
                                                key={user.id}
                                            >
                                                <TableCell>
                                                    {user.photo ? (
                                                        <Image
                                                            src={user.photo}
                                                            alt={`${user.first_name} ${user.last_name}`}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">
                                                            {user.first_name.charAt(0)}
                                                            {user.last_name.charAt(0)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {user.role === "student"
                                                        ? `********`
                                                        : `${user.first_name} ${user.last_name}`}
                                                </TableCell>
                                                <TableCell>
                                                    {user.role === "student" ? `********` : user.email}
                                                </TableCell>
                                                <TableCell className="capitalize">{roles[user.role]}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <div
                                                            className={`mr-2 h-2 w-2 rounded-full ${
                                                                user.status ? "bg-green-500" : "bg-gray-300"
                                                            }`}
                                                        ></div>
                                                        <span className="capitalize">{user.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{new Date().toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            className="hover:cursor-pointer"
                                                            disabled={user.role === "student"}
                                                            asChild
                                                        >
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Acciones</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                className="hover:cursor-pointer"
                                                                onClick={() => handleSetEdit(user)}
                                                            >
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 hover:cursor-pointer"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card id="add-user-card">
                            <CardHeader>
                                <CardTitle>
                                    {idleForm === "create" ? "Agregar Nuevo Usuario" : "Editar Usuario"}
                                </CardTitle>
                                <CardDescription>
                                    {idleForm === "create" ? "Crear una nueva cuenta de usuario" : "Actualizar usuario"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">Nombre</Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                placeholder="Ingrese el nombre"
                                                value={newUser.first_name}
                                                onChange={(e) => handleChange("first_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Apellido</Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                placeholder="Ingrese el apellido"
                                                value={newUser.last_name}
                                                onChange={(e) => handleChange("last_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="photo">Foto</Label>
                                            <Input
                                                id="photo"
                                                type="file"
                                                name="photo"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const url = await uploadUserPhoto(
                                                            file,
                                                            newUser.id || crypto.randomUUID(),
                                                        )
                                                        if (url) handleChange("photo", url)
                                                    }
                                                }}
                                            />

                                            {newUser.photo && (
                                                <div className="mt-2">
                                                    <Image
                                                        src={newUser.photo}
                                                        alt="Preview"
                                                        className="h-16 w-16 rounded-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="Ingrese el correo electrónico"
                                            value={newUser.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Rol</Label>
                                            <Select
                                                name="role"
                                                value={newUser.role}
                                                onValueChange={(value) => handleChange("role", value)}
                                            >
                                                <SelectTrigger id="role">
                                                    <SelectValue placeholder="Seleccione un rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professor">Profesor</SelectItem>
                                                    <SelectItem value="admin">Administrador</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Estado</Label>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Switch
                                                    id="status"
                                                    defaultChecked
                                                    onCheckedChange={(value) => handleChange("status", value)}
                                                />
                                                <Label htmlFor="status" className="font-normal">
                                                    Activo
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Contraseña Temporal</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            placeholder="Ingrese una contraseña temporal"
                                            value={newUser.password}
                                            onChange={(e) => handleChange("password", e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            El usuario deberá cambiar esta contraseña en su primer inicio de sesión
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                            <CardFooter className="flex items-center gap-x-2">
                                <Button onClick={handleSubmit}>Agregar Usuario</Button>
                                {idleForm === "edit" && (
                                    <Button variant="destructive" onClick={handleCancelEdit}>
                                        Cancelar
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}

export default UserManagementPage
