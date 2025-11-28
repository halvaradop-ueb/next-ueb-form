"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Save } from "lucide-react"
import type { ProfessorService, SubjectService } from "@/lib/@types/services"
import { generateNewReportPDF, generateSavedReportPDF } from "@/lib/report"
import type { Report } from "@/lib/@types/reports"
import { createReport, getReports } from "@/services/report"
import { getSubjects } from "@/services/subjects"
import { getProfessors } from "@/services/professors"
import { createPeriods } from "@/lib/utils"

export interface ReportState {
    title: string
    professor: string
    subject: string
    timeframe?: string
    comments?: string
    recommendations?: string
    [key: string]: any
}

// Function to derive semester from timeframe
const deriveSemesterFromTimeframe = (timeframe: string): string | null => {
    try {
        const [startStr] = timeframe.split(" - ")
        const startDate = new Date(startStr)
        const year = startDate.getFullYear()
        const month = startDate.getMonth() + 1 // getMonth() returns 0-11

        // First semester: Jan-June, Second semester: July-Dec
        if (month >= 1 && month <= 6) {
            return `${year}-1`
        } else {
            return `${year}-2`
        }
    } catch {
        return null
    }
}

const timeframes = createPeriods(new Date("2024-01-01"))

const initialReportState: ReportState = {
    title: "",
    professor: "all",
    subject: "",
    timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
    comments: "",
    recommendations: "",
}

export const Reports = () => {
    const [activeTab, setActiveTab] = useState("new")
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [savedReports, setSavedReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [report, setReport] = useState<ReportState>(initialReportState)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (key: keyof ReportState, value: any) => {
        setReport((prev) => ({ ...prev, [key]: value }))
    }

    const resetForm = () => {
        setReport(initialReportState)
        setSubjects([])
    }
    const handleSaveReport = async () => {
        // Validation
        if (!report.title.trim()) {
            alert("Por favor complete el título del informe")
            return
        }

        if (!report.professor || report.professor === "all") {
            alert("Por favor seleccione un profesor específico (no 'Todos los Profesores')")
            return
        }

        if (!report.subject || report.subject === "all") {
            alert("Por favor seleccione una materia específica")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Derive semester from timeframe
            const semester = report.timeframe ? deriveSemesterFromTimeframe(report.timeframe) : null

            const reportData = {
                title: report.title.trim(),
                professor_id: report.professor,
                subject_id: report.subject,
                semester: semester,
                comments: report.comments || "",
                recommendations: report.recommendations || "",
            }

            const newReport = await createReport(reportData)

            if (!newReport) {
                throw new Error("No se recibió respuesta del servidor")
            }

            setSavedReports((prev) => [newReport, ...(prev || [])])
            alert("Borrador guardado exitosamente!")
            setActiveTab("saved")
            resetForm()
        } catch (error: any) {
            console.error("Error al guardar el borrador:", error)
            const errorMessage = error.message || "Ocurrió un error desconocido"
            setError(`Error al guardar: ${errorMessage}`)
            alert(`Error al guardar: ${errorMessage}`)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const [professorsData, reportsData] = await Promise.all([getProfessors(), getReports()])

                setProfessors([
                    ...professorsData,
                    { id: "all", first_name: "Todos", last_name: "los Profesores" } as ProfessorService,
                ])

                setSavedReports(reportsData || [])
            } catch (error) {
                console.error("Error loading initial data:", error)
                setError("Error al cargar los datos iniciales")
                setProfessors([{ id: "all", first_name: "Todos", last_name: "los Profesores" } as ProfessorService])
                setSavedReports([])
            } finally {
                setIsLoading(false)
            }
        }

        loadInitialData()
    }, [])
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                let subjectsData = []
                subjectsData = await getSubjects()
                setSubjects(subjectsData)
            } catch (error) {
                console.error("Error al cargar las materias:", error)
                setSubjects([])
            }
        }

        fetchSubjects()
    }, [report.professor])

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Informes de Profesores</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="new">Crear Nuevo Informe</TabsTrigger>
                        <TabsTrigger value="saved">Informes Guardados</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new" className="space-y-6 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Nuevo Informe de Profesor</CardTitle>
                                <CardDescription>
                                    Crea un informe detallado basado en las evaluaciones de los estudiantes
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="reportTitle">Título del Informe *</Label>
                                    <Input
                                        id="reportTitle"
                                        placeholder="Ej: Evaluación Semestral - Dr. García"
                                        value={report.title}
                                        onChange={(e) => handleChange("title", e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="professor">Profesor *</Label>
                                        <Select
                                            onValueChange={(value) => handleChange("professor", value)}
                                            value={report.professor}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un docente" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {professors.map((prof) => (
                                                    <SelectItem key={prof.id} value={prof.id}>
                                                        {prof.first_name} {prof.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Materia *</Label>
                                        <Select onValueChange={(value) => handleChange("subject", value)} value={report.subject}>
                                            <SelectTrigger>
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
                                        <Select
                                            value={report.timeframe}
                                            onValueChange={(value) => handleChange("timeframe", value)}
                                        >
                                            <SelectTrigger id="timeframe">
                                                <SelectValue placeholder="Selecciona un periodo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeframes.map(({ name, start, end }, index) => (
                                                    <SelectItem
                                                        key={`timeframe-${name}`}
                                                        value={`${start.toISOString()} - ${end.toISOString()}`}
                                                    >
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comments">Análisis y Comentarios</Label>
                                    <Textarea
                                        id="comments"
                                        placeholder="Ingresa tu análisis de los datos de evaluación..."
                                        value={report.comments}
                                        onChange={(e) => handleChange("comments", e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="recommendations">Recomendaciones</Label>
                                    <Textarea
                                        id="recommendations"
                                        placeholder="Ingresa tus recomendaciones para mejorar..."
                                        value={report.recommendations}
                                        onChange={(e) => handleChange("recommendations", e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={handleSaveReport}>
                                    <Save className="mr-2 h-4 w-4" /> Guardar Borrador
                                </Button>
                                <Button onClick={() => generateNewReportPDF(report, professors, subjects)}>
                                    <FileText className="mr-2 h-4 w-4" /> Generar PDF
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="saved" className="pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informes Guardados</CardTitle>
                                <CardDescription>Accede y gestiona tus informes creados previamente</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading && (
                                    <div className="flex justify-center py-8">
                                        <p>Cargando informes...</p>
                                    </div>
                                )}
                                {(!savedReports || savedReports.length === 0) && (
                                    <p className="text-center text-muted-foreground py-8">
                                        {error ? `Error: ${error}` : "No hay informes guardados aún"}
                                    </p>
                                )}
                                {savedReports && savedReports.length > 0 && (
                                    <div className="space-y-4">
                                        {savedReports.map((r) => (
                                            <Card key={r.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{r.title}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                <span className="font-medium">Docente:</span>{" "}
                                                                {r.professor_name ||
                                                                    `${r.professor?.first_name || ""} ${r.professor?.last_name || ""}`.trim() ||
                                                                    "No especificado"}
                                                                {" • "}
                                                                <span className="font-medium">Materia:</span>{" "}
                                                                {r.subject_name || r.subject?.name || "No especificado"}
                                                                {r.semester && (
                                                                    <>
                                                                        {" • "}
                                                                        <span className="font-medium">Semestre:</span>{" "}
                                                                        {r.semester}
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(r.created_at).toLocaleDateString("es-ES")}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => generateSavedReportPDF(savedReports || [], r.id)}
                                                                title="Descargar PDF"
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}
