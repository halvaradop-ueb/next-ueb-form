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
    professor_id: string | null
    subject_id: string | null
    evaluation_criteria?: string | null
    analysis?: string | null
    comments?: string | null
    recommendations?: string | null
    created_at: string
    professor_name?: string | null
    subject_name?: string | null
    professor?: {
        id: string
        first_name: string
        last_name: string
        email?: string
    }
    subject?: {
        id: string
        name: string
        description?: string
    }
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

    const resetForm = () => {
        setReport({
            title: "",
            professor: "",
            subject: "",
            comments: "",
            recommendations: "",
        })
        setSubjects([])
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
                alert("No se encontró la información del profesor o materia.")
                return
            }

            const reportData = {
                title: report.title,
                professor_id: report.professor,
                professor_name: `${professor.first_name} ${professor.last_name}`,
                subject_id: report.subject,
                subject_name: subject.name,
                comments: report.comments || "",
                recommendations: report.recommendations || "",
            }

            const newReport = await createReport(reportData)

            if (newReport) {
                setSavedReports((prev) => [newReport, ...prev])
                alert("Borrador guardado exitosamente!")
                setActiveTab("saved")
                resetForm()
            }
        } catch (error) {
            console.error("Error al guardar el borrador:", error)
            alert(`Error al guardar: ${error instanceof Error ? error.message : "Ocurrió un error"}`)
        } finally {
            setIsLoading(false)
        }
    }

    const generateNewReportPDF = () => {
        if (!report.title || !report.professor || !report.subject) {
            alert("Complete título, profesor y materia antes de generar el PDF")
            return
        }

        const doc = new jsPDF()
        const marginLeft = 20
        let y = 20

        const professor = professors.find((p) => p.id === report.professor)
        const subject = subjects.find((s) => s.id === report.subject)
        const currentDate = new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })

        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 30, "F")
        doc.setFontSize(20)
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.text("REPORTE DOCENTE", 105, 20, { align: "center" })

        y = 40
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Docente: ${professor?.first_name} ${professor?.last_name}`, marginLeft, y)
        y += 8
        doc.text(`Materia: ${subject?.name || "N/A"}`, marginLeft, y)
        y += 8
        doc.text(`Fecha: ${currentDate}`, marginLeft, y)
        y += 10

        doc.setDrawColor(200, 200, 200)
        doc.line(marginLeft, y, 190, y)
        y += 10

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Análisis y Comentarios", marginLeft, y)
        y += 8
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        const commentLines = doc.splitTextToSize(report.comments || "No se registraron comentarios.", 170)
        doc.text(commentLines, marginLeft, y)
        y += commentLines.length * 6 + 10

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Recomendaciones", marginLeft, y)
        y += 8
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        const recLines = doc.splitTextToSize(report.recommendations || "No se registraron recomendaciones.", 170)
        doc.text(recLines, marginLeft, y)
        y += recLines.length * 6 + 10

        doc.setDrawColor(180, 180, 180)
        doc.line(20, 285, 190, 285)
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("Sistema de Evaluacion Docente Programas Postgrados Gerencia de Proyectos - Universidad El bosque", 105, 290, {
            align: "center",
        })

        doc.save(`Reporte_Docente_${professor?.last_name}_${currentDate.replace(/ /g, "_")}.pdf`)
    }

    const generateSavedReportPDF = (reportId: string) => {
        const savedReport = savedReports.find((r) => r.id === reportId)
        if (!savedReport) return

        const doc = new jsPDF()
        const marginLeft = 20
        let y = 20

        const currentDate = new Date(savedReport.created_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })

        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 30, "F")
        doc.setFontSize(20)
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.text("REPORTE DOCENTE HISTÓRICO", 105, 20, { align: "center" })

        y = 40
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Docente: ${savedReport.professor_name || "No disponible"}`, marginLeft, y)
        y += 8
        doc.text(`Materia: ${savedReport.subject_name || "No disponible"}`, marginLeft, y)
        y += 8
        doc.text(`Fecha del informe: ${currentDate}`, marginLeft, y)
        y += 10

        doc.setDrawColor(200, 200, 200)
        doc.line(marginLeft, y, 190, y)
        y += 10

        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Resumen del Reporte", marginLeft, y)
        y += 8
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")

        const summary = [
            `Título: ${savedReport.title}`,
            `Periodo evaluado: ${currentDate}`,
            `Materia: ${savedReport.subject_name}`,
            "Comentarios:",
            ...doc.splitTextToSize(savedReport.comments || "No se registraron comentarios.", 170),
            "",
            "Recomendaciones:",
            ...doc.splitTextToSize(savedReport.recommendations || "No se registraron recomendaciones.", 170),
        ]

        doc.text(summary, marginLeft, y)

        doc.setDrawColor(180, 180, 180)
        doc.line(20, 285, 190, 285)
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("Sistema de Evaluacion Docente Programas Postgrados Gerencia de Proyectos - Universidad El bosque", 105, 290, {
            align: "center",
        })

        doc.save(`Reporte_Historico_${savedReport.professor_name}_${currentDate.replace(/ /g, "_")}.pdf`)
    }
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true)
            try {
                const [professorsData, reportsData] = await Promise.all([getProfessors(), getReports()])
                setProfessors(professorsData)
                setSavedReports(
                    reportsData.filter(
                        (r) =>
                            r.professor_id &&
                            r.subject_id &&
                            (r.professor_name || (r.professor?.first_name && r.professor?.last_name)) &&
                            r.subject_name,
                    ),
                )
            } catch (error) {
                console.error("Error loading initial data:", error)
                alert("Error al cargar los datos iniciales")
            } finally {
                setIsLoading(false)
            }
        }

        loadInitialData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!report.professor) {
                setSubjects([])
                return
            }

            try {
                const data = await getSubjectsByProfessorId(report.professor)
                setSubjects(data)
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
                                                                {new Date(report.created_at).toLocaleDateString("es-ES")}
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
