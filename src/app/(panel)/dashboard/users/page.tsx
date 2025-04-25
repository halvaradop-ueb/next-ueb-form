"use client"
import { useState } from "react"
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

const users = [
    {
        id: "user1",
        name: "John Smith",
        email: "john.smith@example.com",
        role: "estudiante",
        status: "activo",
        lastActive: "2023-11-15",
    },
    {
        id: "user2",
        name: "Jane Doe",
        email: "jane.doe@example.com",
        role: "estudiante",
        status: "activo",
        lastActive: "2023-11-14",
    },
    {
        id: "user3",
        name: "Dr. Robert Johnson",
        email: "robert.johnson@example.com",
        role: "profesor",
        status: "activo",
        lastActive: "2023-11-15",
    },
    {
        id: "user4",
        name: "Sarah Williams",
        email: "sarah.williams@example.com",
        role: "administrador",
        status: "activo",
        lastActive: "2023-11-15",
    },
    {
        id: "user5",
        name: "Michael Brown",
        email: "michael.brown@example.com",
        role: "estudiante",
        status: "inactivo",
        lastActive: "2023-10-20",
    },
    {
        id: "user6",
        name: "Dr. Emily Davis",
        email: "emily.davis@example.com",
        role: "profesor",
        status: "activo",
        lastActive: "2023-11-13",
    },
]

export const UserManagementPage = () => {
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [newUserRole, setNewUserRole] = useState("estudiante")

    const filteredUsers = users.filter(
        (user) =>
            (activeTab === "all" || user.role === activeTab) &&
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    const handleAddUser = () => {
        alert("¡Usuario agregado exitosamente!")
    }

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Gestión de Usuarios</h1>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">Todos los Usuarios</TabsTrigger>
                        <TabsTrigger value="estudiante">Estudiantes</TabsTrigger>
                        <TabsTrigger value="profesor">Profesores</TabsTrigger>
                        <TabsTrigger value="administrador">Administradores</TabsTrigger>
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
                                onClick={() => document.getElementById("add-user-card")?.scrollIntoView({ behavior: "smooth" })}
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
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell className="capitalize">{user.role}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <div
                                                            className={`mr-2 h-2 w-2 rounded-full ${
                                                                user.status === "activo" ? "bg-green-500" : "bg-gray-300"
                                                            }`}
                                                        ></div>
                                                        <span className="capitalize">{user.status}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{user.lastActive}</TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Acciones</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                                            <DropdownMenuItem>Restablecer Contraseña</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
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
                                <CardTitle>Agregar Nuevo Usuario</CardTitle>
                                <CardDescription>Crear una nueva cuenta de usuario</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Nombre</Label>
                                        <Input id="firstName" placeholder="Ingrese el nombre" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Apellido</Label>
                                        <Input id="lastName" placeholder="Ingrese el apellido" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" type="email" placeholder="Ingrese el correo electrónico" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Rol</Label>
                                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Seleccione un rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="estudiante">Estudiante</SelectItem>
                                                <SelectItem value="profesor">Profesor</SelectItem>
                                                <SelectItem value="administrador">Administrador</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Estado</Label>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch id="status" defaultChecked />
                                            <Label htmlFor="status" className="font-normal">
                                                Activo
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña Temporal</Label>
                                    <Input id="password" type="password" placeholder="Ingrese una contraseña temporal" />
                                    <p className="text-xs text-muted-foreground">
                                        El usuario deberá cambiar esta contraseña en su primer inicio de sesión
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleAddUser}>Agregar Usuario</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}

export default UserManagementPage
