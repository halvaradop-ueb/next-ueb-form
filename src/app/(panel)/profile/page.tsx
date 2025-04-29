"use client"
import { useState, useEffect } from "react"
import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, BookOpen, Clock, Save, Edit, UserPlus, FileText, Settings } from "lucide-react"
import { getAuthenticated, updateUser } from "@/services/users"
import { UserService } from "@/lib/@types/services"

export default function ProfilePage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState("personal")
    const [isEditing, setIsEditing] = useState(false)
    const [user, setUser] = useState<UserService>({} as UserService)

    const handleChange = (field: string, value: string) => {
        setUser((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    const handleSave = async () => {
        setIsEditing(false)
        await updateUser(user)
        alert("Profile updated successfully!")
    }

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getAuthenticated(session!)
            setUser(user!)
        }
        fetchUser()
    }, [])

    if (!session) {
        redirect("/auth")
    }

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <Button variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                        </>
                    ) : (
                        <>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Perfil
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col items-center space-y-4">
                                <Avatar className="h-32 w-32">
                                    <AvatarImage src="/placeholder-user.jpg" alt="Foto de perfil" />
                                    <AvatarFallback>{`${user.first_name?.charAt(0)}${user.last_name?.charAt(0)}`}</AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold">
                                        {user.first_name} {user.last_name}
                                    </h2>
                                    <p className="text-muted-foreground">Gestión de Proyectos</p>
                                </div>
                                <Badge variant="outline" className="capitalize">
                                    {user.role ?? "admin"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>+57 {user.phone}</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{user.address}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">Información Personal</TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal" className="space-y-6 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Información Personal</CardTitle>
                                    <CardDescription>Actualiza tus datos personales</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">Nombre</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="first_name"
                                                    value={user.first_name}
                                                    onChange={(e) => handleChange("first_name", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {user.first_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Apellido</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="last_name"
                                                    value={user.last_name}
                                                    onChange={(e) => handleChange("last_name", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {user.last_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        {isEditing ? (
                                            <Input
                                                id="email"
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2">{user.email}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        {isEditing ? (
                                            <Input
                                                id="phone"
                                                value={user.phone}
                                                onChange={(e) => handleChange("phone", e.target.value)}
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2">{user.phone}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Dirección</Label>
                                        {isEditing ? (
                                            <Input
                                                id="address"
                                                value={user.address}
                                                onChange={(e) => handleChange("address", e.target.value)}
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2">
                                                {user.address}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                                {isEditing && (
                                    <CardFooter>
                                        <Button onClick={handleSave}>Guardar Cambios</Button>
                                    </CardFooter>
                                )}
                            </Card>

                            {/* {user.role === "professor" && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Información Académica</CardTitle>
                                        <CardDescription>Detalles académicos y de oficina</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Departamento</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="department"
                                                    value={formData.department}
                                                    onChange={(e) => handleChange("department", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {formData.department}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="office">Oficina</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="office"
                                                    value={formData.office}
                                                    onChange={(e) => handleChange("office", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {formData.office}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="officeHours">Horario de Oficina</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="officeHours"
                                                    value={formData.officeHours}
                                                    onChange={(e) => handleChange("officeHours", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {formData.officeHours}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Educación</Label>
                                            {user.education.map((edu, index) => (
                                                <div key={index} className="rounded-md border border-input bg-background p-3">
                                                    <p className="font-medium">{edu.degree}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {edu.institution}, {edu.year}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )} */}
                        </TabsContent>

                        {user.role === "admin" && (
                            <TabsContent value="activity" className="space-y-6 pt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Actividad Reciente</CardTitle>
                                        <CardDescription>Tus acciones recientes en el sistema</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    <UserPlus className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Agregaste un nuevo usuario</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Agregaste a Jane Doe como estudiante
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Generaste un informe</p>
                                                    <p className="text-sm text-muted-foreground">Revisión Anual - Dr. Smith</p>
                                                    <p className="text-xs text-muted-foreground">Ayer</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                                    <Settings className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Actualizaste la configuración del sistema</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Cambiaste las fechas del periodo de evaluación
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Hace 3 días</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {user.role === "admin" && (
                            <TabsContent value="permissions" className="space-y-6 pt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Permisos del Sistema</CardTitle>
                                        <CardDescription>Tus niveles de acceso en el sistema</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Gestión de Usuarios</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Crear, editar y eliminar usuarios
                                                    </p>
                                                </div>
                                                <Badge>Acceso Completo</Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Generación de Informes</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Crear y ver informes de evaluación
                                                    </p>
                                                </div>
                                                <Badge>Acceso Completo</Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Configuración del Sistema</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Modificar configuraciones del sistema
                                                    </p>
                                                </div>
                                                <Badge>Acceso Completo</Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Exportación de Datos</p>
                                                    <p className="text-sm text-muted-foreground">Exportar datos del sistema</p>
                                                </div>
                                                <Badge>Acceso Completo</Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
