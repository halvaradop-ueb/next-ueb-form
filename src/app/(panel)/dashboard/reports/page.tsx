"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Save } from "lucide-react";

const professors = [
    { id: "prof1", name: "Dr. Smith" },
    { id: "prof2", name: "Dr. Johnson" },
    { id: "prof3", name: "Prof. Williams" },
    { id: "prof4", name: "Dr. Brown" },
    { id: "prof5", name: "Dr. Davis" },
];

const subjects = [
    { id: "math", name: "Matemáticas" },
    { id: "cs", name: "Ciencias de la Computación" },
    { id: "physics", name: "Física" },
    { id: "chemistry", name: "Química" },
    { id: "biology", name: "Biología" },
];

const evaluationCriteria = [
    { id: "teachingQuality", name: "Calidad de Enseñanza" },
    { id: "communication", name: "Comunicación" },
    { id: "availability", name: "Disponibilidad" },
    { id: "fairness", name: "Imparcialidad" },
    { id: "knowledge", name: "Conocimiento de la Materia" },
    { id: "organization", name: "Organización del Curso" },
];

const timeframes = [
    { id: "semester", name: "Semestre Actual" },
    { id: "year", name: "Último Año" },
    { id: "all", name: "Todo el Tiempo" },
];

export default function AdminReportsPage() {
    const [activeTab, setActiveTab] = useState("new");
    const [selectedProfessor, setSelectedProfessor] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [reportTitle, setReportTitle] = useState("");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
    const [comments, setComments] = useState("");
    const [recommendations, setRecommendations] = useState("");

    const toggleCriterion = (criterionId: string) => {
        setSelectedCriteria((prev) =>
            prev.includes(criterionId) ? prev.filter((id) => id !== criterionId) : [...prev, criterionId],
        );
    };

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
    ];

    const handleSaveReport = () => {
        alert("¡Informe guardado exitosamente!");
    };

    const handleGenerateReport = () => {
        alert("¡Informe generado exitosamente!");
    };

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
                                        value={reportTitle}
                                        onChange={(e) => setReportTitle(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="professor">Profesor</Label>
                                        <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
                                            <SelectTrigger id="professor">
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
                                        <Label htmlFor="subject">Materia</Label>
                                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
                                    <Label>Criterios de Evaluación</Label>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        {evaluationCriteria.map((criterion) => (
                                            <div key={criterion.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={criterion.id}
                                                    checked={selectedCriteria.includes(criterion.id)}
                                                    onCheckedChange={() => toggleCriterion(criterion.id)}
                                                />
                                                <Label htmlFor={criterion.id} className="font-normal">
                                                    {criterion.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="comments">Análisis y Comentarios</Label>
                                    <Textarea
                                        id="comments"
                                        placeholder="Ingresa tu análisis de los datos de evaluación..."
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recommendations">Recomendaciones</Label>
                                    <Textarea
                                        id="recommendations"
                                        placeholder="Ingresa tus recomendaciones para mejorar..."
                                        value={recommendations}
                                        onChange={(e) => setRecommendations(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={handleSaveReport}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Borrador
                                </Button>
                                <Button onClick={handleGenerateReport}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generar Informe
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
                                                        <Button variant="ghost" size="icon">
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
    );
}
