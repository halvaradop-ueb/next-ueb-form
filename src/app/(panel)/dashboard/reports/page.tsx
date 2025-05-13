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
import type { ReportState } from "@/lib/@types/types"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { jsPDF } from "jspdf"

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
    const [report, setReport] = useState<ReportState>({} as ReportState)

    const handleChange = (key: keyof ReportState, value: any) => {
        setReport((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    const savedReports = [
        {
            id: "rep1",
            title: "Revisión Anual - Dr. Smith",
            professor: "Dr. Smith",
            subject: "Matemáticas",
            date: "2023-11-01",
        },
        {
            id: "rep2",
            title: "Evaluación Semestral - Dr. Johnson",
            professor: "Dr. Johnson",
            subject: "Ciencias de la Computación",
            date: "2023-10-15",
        },
        {
            id: "rep3",
            title: "Plan de Mejora Docente - Prof. Williams",
            professor: "Prof. Williams",
            subject: "Física",
            date: "2023-09-30",
        },
    ]

    const handleSaveReport = () => {
        alert("¡Informe guardado exitosamente!")
    }

    useEffect(() => {
        const fetchData = async () => {
            const [professors] = await Promise.all([getProfessors()])
            setProfessors(professors)
        }
        fetchData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!report?.professor) return
            const subjects = await getSubjectsByProfessorId(report.professor)
            setSubjects(subjects)
        }
        fetchSubjects()
    }, [report?.professor])

    const generateNewReportPDF = () => {
        if (!report.title || !report.professor || !report.subject) {
            alert("Complete título, profesor y materia antes de generar el PDF")
            return
        }

        const doc = new jsPDF()

        const professor = professors.find((p) => p.id === report.professor)
        const subject = subjects.find((s) => s.id === report.subject)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.text(`Informe: ${report.title}`, 105, 20, { align: "center" })

        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Profesor: ${professor?.first_name} ${professor?.last_name}`, 20, 40)
        doc.text(`Materia: ${subject?.name || "N/A"}`, 20, 50)
        doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 20, 60)

        doc.setFontSize(14)
        doc.text("Análisis y Comentarios:", 20, 80)
        doc.setFontSize(11)
        const splitComments = doc.splitTextToSize(report.comments || "Sin comentarios", 170)
        doc.text(splitComments, 20, 90)

        doc.setFontSize(14)
        doc.text("Recomendaciones:", 20, 150)
        doc.setFontSize(11)
        const splitRecs = doc.splitTextToSize(report.recommendations || "Sin recomendaciones", 170)
        doc.text(splitRecs, 20, 160)

        doc.save(`Informe_${report.title.replace(/ /g, "_")}.pdf`)
    }

    const generateSavedReportPDF = (reportId: string) => {
        const savedReport = savedReports.find((r) => r.id === reportId)
        if (!savedReport) return

        const doc = new jsPDF()

        doc.setFont("helvetica", "bold")
        doc.setFontSize(18)
        doc.text(savedReport.title, 105, 20, { align: "center" })

        doc.setFontSize(12)
        doc.setFont("helvetica", "normal")
        doc.text(`Profesor: ${savedReport.professor}`, 20, 40)
        doc.text(`Materia: ${savedReport.subject}`, 20, 50)
        doc.text(`Fecha: ${savedReport.date}`, 20, 60)

        doc.setFontSize(14)
        doc.text("Resumen de Evaluación:", 20, 80)
        doc.setFontSize(11)
        doc.text("Este informe contiene datos históricos de evaluaciones realizadas por estudiantes.", 20, 90)

        doc.save(`Informe_Guardado_${savedReport.id}.pdf`)
    }

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
                                    <Label htmlFor="reportTitle">Título del Informe</Label>
                                    <Input
                                        id="reportTitle"
                                        placeholder="Ingresa el título del informe"
                                        value={report.title}
                                        onChange={(e) => handleChange("title", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="professor">Profesor</Label>
                                        <Select
                                            value={report.professor}
                                            onValueChange={(value) => handleChange("professor", value)}
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
                                        <Label htmlFor="subject">Materia</Label>
                                        <Select
                                            value={report.subject}
                                            disabled={!report.professor}
                                            onValueChange={(value) => handleChange("subject", value)}
                                        >
                                            <SelectTrigger id="subject">
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
                                <div className="space-y-4">
                                    {savedReports.map((report) => (
                                        <Card key={report.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">{report.title}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {report.professor} • {report.subject}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <p className="text-sm text-muted-foreground">{report.date}</p>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => generateSavedReportPDF(report.id)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    )
}

export default AdminReportsPage
