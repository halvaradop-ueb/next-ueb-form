"use client"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const subjects = [
    { id: "all", name: "Todas las Materias" },
    { id: "math", name: "Matemáticas" },
    { id: "cs", name: "Ciencias de la Computación" },
    { id: "physics", name: "Física" },
    { id: "chemistry", name: "Química" },
    { id: "biology", name: "Biología" },
]

const professors = [
    { id: "all", name: "Todos los Profesores" },
    { id: "prof1", name: "Dr. Smith" },
    { id: "prof2", name: "Dr. Johnson" },
    { id: "prof3", name: "Prof. Williams" },
    { id: "prof4", name: "Dr. Brown" },
    { id: "prof5", name: "Dr. Davis" },
]

const timeframes = [
    { id: "semester", name: "Semestre Actual" },
    { id: "year", name: "Último Año" },
    { id: "all", name: "Todo el Tiempo" },
]

const mockFeedbackData = {
    averageRatings: {
        teachingQuality: 4.2,
        communication: 3.8,
        availability: 4.0,
        fairness: 4.1,
        knowledge: 4.7,
        organization: 3.9,
        overall: 4.1,
    },
    ratingDistribution: {
        5: 42,
        4: 28,
        3: 18,
        2: 8,
        1: 4,
    },
    recentComments: [
        {
            id: 1,
            studentName: "Estudiante Anónimo",
            professor: "Dr. Smith",
            subject: "Matemáticas",
            rating: 5,
            comment:
                "El Dr. Smith es un profesor excepcional que hace que conceptos matemáticos complejos sean fáciles de entender. Siempre disponible para preguntas y muy solidario.",
            date: "2023-11-15",
        },
        {
            id: 2,
            studentName: "Estudiante Anónimo",
            professor: "Dr. Johnson",
            subject: "Ciencias de la Computación",
            rating: 4,
            comment:
                "Gran profesor con un conocimiento profundo del tema. A veces las clases avanzan un poco rápido, pero en general, muy buena enseñanza.",
            date: "2023-11-10",
        },
        {
            id: 3,
            studentName: "Estudiante Anónimo",
            professor: "Prof. Williams",
            subject: "Física",
            rating: 3,
            comment:
                "Conocedor, pero podría mejorar al explicar conceptos difíciles. Sin embargo, las horas de oficina fueron muy útiles.",
            date: "2023-11-05",
        },
    ],
}

interface FeedbackState {
    professor: string
    subject: string
    timeframe: string
}

const FeedbackPage = () => {
    const [options, setOptions] = useState<FeedbackState>()

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Revisión de Retroalimentación</h2>
                <p className="text-muted-foreground">Revisar la retroalimentación proporcionada por los estudiantes</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="selectedProfessor">Profesor</Label>
                    <Select>
                        <SelectTrigger id="selectedProfessor">
                            <SelectValue placeholder="Selecciona un profesor" />
                        </SelectTrigger>
                        <SelectContent>
                            {professors.map((professor) => (
                                <SelectItem key={professor.id} value={professor.id}>
                                    {professor.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="selectedSubject">Materia</Label>
                    <Select>
                        <SelectTrigger id="selectedSubject">
                            <SelectValue placeholder="Selecciona una materia" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timeframe">Periodo de Tiempo</Label>
                    <Select>
                        <SelectTrigger id="timeframe">
                            <SelectValue placeholder="Selecciona un periodo de tiempo" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeframes.map((timeframe) => (
                                <SelectItem key={timeframe.id} value={timeframe.id}>
                                    {timeframe.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Tabs className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Resumen</TabsTrigger>
                    <TabsTrigger value="ratings">Calificaciones</TabsTrigger>
                    <TabsTrigger value="comments">Comentarios</TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Calificación General</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-5xl font-bold">{mockFeedbackData.averageRatings.overall}</span>
                                    <span className="text-2xl text-muted-foreground">/5</span>
                                    <p className="text-sm text-muted-foreground">Basado en evaluaciones de estudiantes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Participación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <span className="text-3xl font-bold">
                                        {Object.values(mockFeedbackData.ratingDistribution).reduce((a, b) => a + b, 0)}
                                    </span>
                                    <p className="text-sm text-muted-foreground">Total de Evaluaciones</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Promedios</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Calidad de Enseñanza</span>
                                    <span className="font-medium">{mockFeedbackData.averageRatings.teachingQuality}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Conocimiento</span>
                                    <span className="font-medium">{mockFeedbackData.averageRatings.knowledge}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Justicia</span>
                                    <span className="font-medium">{mockFeedbackData.averageRatings.fairness}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="ratings" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribución de Calificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const percentage =
                                    (mockFeedbackData.ratingDistribution[
                                        rating as keyof typeof mockFeedbackData.ratingDistribution
                                    ] /
                                        Object.values(mockFeedbackData.ratingDistribution).reduce((a, b) => a + b, 0)) *
                                    100
                                return (
                                    <div key={rating} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span>{rating} Estrellas</span>
                                            <span>{percentage.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Calificaciones por Categoría</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(mockFeedbackData.averageRatings)
                                .filter(([key]) => key !== "overall")
                                .map(([key, value]) => {
                                    const percentage = (value / 5) * 100
                                    return (
                                        <div key={key} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                                                <span>{value}/5</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    )
                                })}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="comments" className="space-y-4 pt-4">
                    {mockFeedbackData.recentComments.map((comment) => (
                        <Card key={comment.id}>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{comment.professor}</p>
                                            <p className="text-sm text-muted-foreground">{comment.subject}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1 font-medium">{comment.rating}/5</span>
                                            <span className="text-xs text-muted-foreground">{comment.date}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm">{comment.comment}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </section>
    )
}

export default FeedbackPage
