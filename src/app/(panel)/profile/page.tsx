"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, BookOpen, Clock, Save, Edit, UserPlus, FileText, Settings } from "lucide-react"

const userData = {
    id: "prof123",
    role: "profesor",
    firstName: "Roberto",
    lastName: "Johnson",
    email: "roberto.johnson@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Avenida Universidad, Ciudad Universitaria, CT 12345",
    bio: "Profesor de Ciencias de la Computación con más de 15 años de experiencia en enseñanza e investigación. Especializado en inteligencia artificial y aprendizaje automático.",
    department: "Ciencias de la Computación",
    office: "Edificio de Ciencias, Oficina 305",
    officeHours: "Lunes y Miércoles 2-4pm",
    courses: [
        { id: "cs101", name: "Introducción a la Computación" },
        { id: "cs301", name: "Estructuras de Datos y Algoritmos" },
        { id: "cs401", name: "Inteligencia Artificial" },
    ],
    education: [
        { degree: "Doctorado en Ciencias de la Computación", institution: "Universidad de Stanford", year: "2005" },
        { degree: "Maestría en Ciencias de la Computación", institution: "MIT", year: "2001" },
        { degree: "Licenciatura en Ingeniería en Computación", institution: "UC Berkeley", year: "1999" },
    ],
    publications: [
        {
            title: "Avances en Arquitecturas de Redes Neuronales",
            journal: "Revista de Inteligencia Artificial",
            year: "2020",
        },
        {
            title: "Aplicaciones del Aprendizaje Automático en la Educación",
            journal: "Revisión de Tecnología Educativa",
            year: "2018",
        },
    ],
    evaluationStats: {
        averageRating: 4.7,
        totalEvaluations: 156,
        recentEvaluations: 24,
    },
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("personal")
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        bio: userData.bio,
        department: userData.department,
        office: userData.office,
        officeHours: userData.officeHours,
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData({
            ...formData,
            [field]: value,
        })
    }

    const handleSave = () => {
        setIsEditing(false)
        alert("Profile updated successfully!")
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
                                    <AvatarFallback>{`${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`}</AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold">
                                        {userData.firstName} {userData.lastName}
                                    </h2>
                                    <p className="text-muted-foreground">{userData.department}</p>
                                </div>
                                <Badge variant="outline" className="capitalize">
                                    {userData.role}
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
                                <span>{userData.email}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{userData.phone}</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{userData.address}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {userData.role === "professor" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Enseñanza</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center">
                                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{userData.department}</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{userData.office}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{userData.officeHours}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {userData.role === "professor" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen de Evaluaciones</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span>Calificación Promedio</span>
                                    <span className="font-bold">{userData.evaluationStats.averageRating}/5</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Total de Evaluaciones</span>
                                    <span>{userData.evaluationStats.totalEvaluations}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Evaluaciones Recientes</span>
                                    <span>{userData.evaluationStats.recentEvaluations}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">Información Personal</TabsTrigger>
                            {userData.role === "professor" && <TabsTrigger value="courses">Cursos</TabsTrigger>}
                            {userData.role === "professor" && <TabsTrigger value="publications">Publicaciones</TabsTrigger>}
                            {userData.role === "admin" && <TabsTrigger value="activity">Actividad</TabsTrigger>}
                            {userData.role === "admin" && <TabsTrigger value="permissions">Permisos</TabsTrigger>}
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
                                                    id="firstName"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {formData.firstName}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Apellido</Label>
                                            {isEditing ? (
                                                <Input
                                                    id="lastName"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {formData.lastName}
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
                                                value={formData.email}
                                                onChange={(e) => handleInputChange("email", e.target.value)}
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2">
                                                {formData.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        {isEditing ? (
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2">
                                                {formData.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Dirección</Label>
                                        {isEditing ? (
                                            <Input
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) => handleInputChange("address", e.target.value)}
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2">
                                                {formData.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Biografía</Label>
                                        {isEditing ? (
                                            <Textarea
                                                id="bio"
                                                value={formData.bio}
                                                onChange={(e) => handleInputChange("bio", e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                        ) : (
                                            <p className="rounded-md border border-input bg-background px-3 py-2 min-h-[100px]">
                                                {formData.bio}
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

                            {userData.role === "professor" && (
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
                                                    onChange={(e) => handleInputChange("department", e.target.value)}
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
                                                    onChange={(e) => handleInputChange("office", e.target.value)}
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
                                                    onChange={(e) => handleInputChange("officeHours", e.target.value)}
                                                />
                                            ) : (
                                                <p className="rounded-md border border-input bg-background px-3 py-2">
                                                    {formData.officeHours}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Educación</Label>
                                            {userData.education.map((edu, index) => (
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
                            )}
                        </TabsContent>

                        {userData.role === "professor" && (
                            <TabsContent value="courses" className="space-y-6 pt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Cursos Actuales</CardTitle>
                                        <CardDescription>Cursos que estás enseñando actualmente</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {userData.courses.map((course) => (
                                            <Card key={course.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{course.name}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                ID del Curso: {course.id}
                                                            </p>
                                                        </div>
                                                        <Button variant="outline" size="sm">
                                                            Ver Detalles
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {userData.role === "professor" && (
                            <TabsContent value="publications" className="space-y-6 pt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Publicaciones</CardTitle>
                                        <CardDescription>Tus publicaciones académicas e investigaciones</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {userData.publications.map((pub, index) => (
                                            <Card key={index}>
                                                <CardContent className="p-4">
                                                    <div className="space-y-1">
                                                        <h3 className="font-medium">{pub.title}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {pub.journal}, {pub.year}
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {isEditing && (
                                            <Button variant="outline" className="w-full">
                                                Agregar Publicación
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {userData.role === "admin" && (
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

                        {userData.role === "admin" && (
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
