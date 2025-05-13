//mejora
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
import { getProfessors } from "@/services/professors"
import type { ProfessorService, SubjectService } from "@/lib/@types/services"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { jsPDF } from "jspdf"
import { createReport, getReports } from "@/services/report"

interface Report {
    id: string
    title: string
    professor_id: string
    professor_name: string
    subject_id: string
    subject_name: string
    comments?: string
    recommendations?: string
    status: "draft" | "published"
    created_at: string
}

interface ReportState {
    title: string
    professor: string
    subject: string
    timeframe?: string
    comments?: string
    recommendations?: string
    [key: string]: any
}

const evaluationCriteria = [
    { id: "teachingQuality", name: "Calidad de Enseñanza" },
    { id: "communication", name: "Comunicación" },
    { id: "availability", name: "Disponibilidad" },
    { id: "fairness", name: "Imparcialidad" },
    { id: "knowledge", name: "Conocimiento de la Materia" },
    { id: "organization", name: "Organización del Curso" },
]

const timeframes = [{ id: "all", name: "Todo el Tiempo" }]

const AdminReportsPage = () => {
    const [activeTab, setActiveTab] = useState("new")
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [savedReports, setSavedReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [report, setReport] = useState<ReportState>({
        title: "",
        professor: "",
        subject: "",
        comments: "",
        recommendations: "",
    })

    const handleChange = (key: keyof ReportState, value: any) => {
        setReport((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    const handleSaveReport = async () => {
        if (!report.title || !report.professor || !report.subject) {
            alert("Por favor complete todos los campos obligatorios: título, profesor y materia")
            return
        }

        setIsLoading(true)
        try {
            const professor = professors.find((p) => p.id === report.professor)
            const subject = subjects.find((s) => s.id === report.subject)

            if (!professor || !subject) {
                throw new Error("No se encontró la información del profesor o materia")
            }

            const newReport = await createReport({
                title: report.title,
                professor_id: report.professor, // Solo el ID
                subject_id: report.subject, // Solo el ID
                comments: report.comments || "",
                recommendations: report.recommendations || "",
                status: "draft",
            })

            if (newReport) {
                setSavedReports((prev) => [newReport, ...prev])
                alert("Borrador guardado exitosamente!")
                setActiveTab("saved")
                // Resetear el formulario
                setReport({
                    title: "",
                    professor: "",
                    subject: "",
                    comments: "",
                    recommendations: "",
                })
            }
        } catch (error) {
            console.error("Error al guardar el borrador:", error)
            alert("Ocurrió un error al guardar el borrador. Por favor intente nuevamente.")
        } finally {
            setIsLoading(false)
        }
    }
    const generateNewReportPDF = () => {
        if (!report.title || !report.professor || !report.subject) {
            alert("Complete título, profesor y materia antes de generar el PDF")
            return
        }

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        })

        const professor = professors.find((p) => p.id === report.professor)
        const subject = subjects.find((s) => s.id === report.subject)
        const currentDate = new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })

        // Encabezado
        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 30, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(20)
        doc.setTextColor(255, 255, 255)
        doc.text("REPORTE DOCENTE", 105, 20, { align: "center" })

        // Información del reporte
        doc.setFillColor(240, 240, 240)
        doc.rect(0, 30, 210, 10, "F")
        doc.setFontSize(14)
        doc.setTextColor(30, 41, 59)
        doc.text(`Docente: ${professor?.first_name} ${professor?.last_name}`, 20, 45)
        doc.text(`Materia: ${subject?.name || "N/A"}`, 20, 55)
        doc.text(`Fecha: ${currentDate}`, 20, 65)

        // Contenido
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 75, 190, 75)
        doc.setFontSize(16)
        doc.text("Análisis y Comentarios", 20, 85)
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(20, 90, 170, 50, 3, 3, "F")
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(11)
        const splitComments = doc.splitTextToSize(report.comments || "No se registraron comentarios.", 160)
        doc.text(splitComments, 25, 95)

        doc.setFontSize(16)
        doc.setTextColor(30, 41, 59)
        doc.text("Recomendaciones", 20, 150)
        doc.roundedRect(20, 155, 170, 50, 3, 3, "F")
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(11)
        const splitRecs = doc.splitTextToSize(report.recommendations || "No se registraron recomendaciones.", 160)
        doc.text(splitRecs, 25, 160)

        // Pie de página
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("Sistema de Gestión Docente - Universidad XYZ", 105, 290, { align: "center" })

        doc.save(`Reporte_Docente_${professor?.last_name}_${currentDate.replace(/ /g, "_")}.pdf`)
    }

    const generateSavedReportPDF = (reportId: string) => {
        const savedReport = savedReports.find((r) => r.id === reportId)
        if (!savedReport) return

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        })

        // Encabezado
        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 30, "F")
        doc.setFont("helvetica", "bold")
        doc.setFontSize(20)
        doc.setTextColor(255, 255, 255)
        doc.text("REPORTE DOCENTE HISTÓRICO", 105, 20, { align: "center" })

        // Información del reporte
        doc.setFillColor(240, 240, 240)
        doc.rect(0, 30, 210, 10, "F")
        doc.setFontSize(14)
        doc.setTextColor(30, 41, 59)
        doc.text(`Docente: ${savedReport.professor_name}`, 20, 45)
        doc.text(`Materia: ${savedReport.subject_name}`, 20, 55)
        doc.text(`Fecha del informe: ${new Date(savedReport.created_at).toLocaleDateString("es-ES")}`, 20, 65)

        // Contenido
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 75, 190, 75)
        doc.setFontSize(16)
        doc.text("Evaluación General", 20, 85)
        doc.setFillColor(255, 255, 255)
        doc.roundedRect(20, 90, 170, 100, 3, 3, "F")
        doc.setTextColor(60, 60, 60)
        doc.setFontSize(11)

        const evaluationText = [
            `Título: ${savedReport.title}`,
            `Periodo evaluado: ${new Date(savedReport.created_at).toLocaleDateString("es-ES")}`,
            `Materia: ${savedReport.subject_name}`,
            "\nEste informe contiene los resultados históricos de las evaluaciones",
            "realizadas por los estudiantes durante el periodo correspondiente.",
        ]
        doc.text(evaluationText, 25, 95)

        // Gráficos simulados
        doc.setFillColor(59, 130, 246)
        doc.rect(25, 120, 40, 5, "F")
        doc.text("Calidad de enseñanza: 8.5/10", 70, 123)

        doc.setFillColor(16, 185, 129)
        doc.rect(25, 130, 35, 5, "F")
        doc.text("Comunicación: 7.8/10", 70, 133)

        doc.setFillColor(245, 158, 11)
        doc.rect(25, 140, 45, 5, "F")
        doc.text("Conocimiento: 9.0/10", 70, 143)

        // Pie de página
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("Sistema de Gestión Docente - Universidad XYZ", 105, 290, { align: "center" })

        doc.save(`Reporte_Historico_${savedReport.professor_name.replace(/ /g, "_")}.pdf`)
    }
    useEffect(() => {
        const loadReports = async () => {
            setIsLoading(true)
            try {
                const reports = await getReports() // Usa el servicio que creamos
                setSavedReports(reports)
            } catch (error) {
                console.error("Error loading reports:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadReports()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!report?.professor) return
            try {
                const subjectsData = await getSubjectsByProfessorId(report.professor)
                setSubjects(subjectsData)
            } catch (error) {
                console.error("Error cargando materias:", error)
            }
        }
        fetchSubjects()
    }, [report?.professor])

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
                                            value={report.professor}
                                            onValueChange={(value) => handleChange("professor", value)}
                                            required
                                        >
                                            <SelectTrigger id="professor">
                                                <SelectValue placeholder="Selecciona un profesor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {professors.map((professor) => (
                                                    <SelectItem key={professor.id} value={professor.id}>
                                                        {professor.first_name} {professor.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Materia *</Label>
                                        <Select
                                            value={report.subject}
                                            disabled={!report.professor}
                                            onValueChange={(value) => handleChange("subject", value)}
                                            required
                                        >
                                            <SelectTrigger id="subject">
                                                <SelectValue
                                                    placeholder={
                                                        report.professor
                                                            ? "Selecciona una materia"
                                                            : "Primero selecciona un profesor"
                                                    }
                                                />
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
                                                {timeframes.map((timeframe) => (
                                                    <SelectItem key={timeframe.id} value={timeframe.id}>
                                                        {timeframe.name}
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
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Borrador
                                </Button>
                                <Button onClick={generateNewReportPDF}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generar PDF
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
                                {isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <p>Cargando informes...</p>
                                    </div>
                                ) : savedReports.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No hay informes guardados aún</p>
                                ) : (
                                    <div className="space-y-4">
                                        {savedReports.map((report) => (
                                            <Card key={report.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-medium">{report.title}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {report.professor_name} • {report.subject_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(report.created_at).toLocaleDateString("es-ES")} •
                                                                {report.status === "draft" ? "Borrador" : "Publicado"}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => generateSavedReportPDF(report.id)}
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

export default AdminReportsPage
