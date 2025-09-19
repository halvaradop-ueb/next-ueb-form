"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ProfessorService, SubjectService } from "@/lib/@types/services"
import { getSubjects, getSubjectsByProfessorId } from "@/services/subjects"
import { getProfessors } from "@/services/professors"
import { Save } from "lucide-react"
import { createPeriods } from "@/lib/utils"

export interface PeerReviewState {
    title: string
    professor: string
    subject: string
    timeframe?: string
    comments?: string
    findings?: string
}
const timeframes = createPeriods(new Date("2024-01-01"))

const initialselectedOptionsState: PeerReviewState = {
    title: "",
    professor: "",
    subject: "",
    timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
    comments: "",
    findings: "",
}

export const PeerReviewForm = () => {
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [selectedOptions, setSelectedOptions] = useState<PeerReviewState>(initialselectedOptionsState)
    const [isLoading, setIsLoading] = useState(true)

    const handleChange = (key: keyof PeerReviewState, value: any) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    const resetForm = () => {
        setSubjects([])
        setSelectedOptions(initialselectedOptionsState)
    }

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true)
            try {
                const [professorsData] = await Promise.all([getProfessors()])
                setProfessors(professorsData)
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
            if (!selectedOptions.professor) {
                setSubjects([])
                return
            }

            try {
                if (selectedOptions.professor === "all") {
                    const data = await getSubjects()
                    setSubjects(data)
                } else {
                    const data = await getSubjectsByProfessorId(selectedOptions.professor)
                    setSubjects(data)
                }
            } catch (error) {
                console.error("Error al cargar las materias:", error)
                setSubjects([])
            }
        }

        fetchSubjects()
    }, [selectedOptions.professor])

    return (
        <Card>
            <CardHeader className="text-left">
                <CardTitle className="justify-start">Coevalulación</CardTitle>
                <CardDescription className="justify-start">Desarrollo de la coevualuación</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="professor">Profesor *</Label>
                        <Select onValueChange={(value) => handleChange("professor", value)} value={selectedOptions.professor}>
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
                        <Select onValueChange={(value) => handleChange("subject", value)} value={selectedOptions.subject}>
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
                        <Select value={selectedOptions.timeframe} onValueChange={(value) => handleChange("timeframe", value)}>
                            <SelectTrigger id="timeframe">
                                <SelectValue placeholder="Selecciona un periodo" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeframes.map(({ name, start, end }, index) => (
                                    <SelectItem key={`timeframe-${name}`} value={`${start.toISOString()} - ${end.toISOString()}`}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="findings">Hallazgos</Label>
                    <Textarea
                        id="findings"
                        placeholder="Ingresa tus hallazgos..."
                        value={selectedOptions.findings}
                        onChange={(e) => handleChange("findings", e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="comments">Plan de Mejoramiento y Realimentación</Label>
                    <Textarea
                        id="comments"
                        placeholder="Ingresa tus comentarios..."
                        value={selectedOptions.comments}
                        onChange={(e) => handleChange("comments", e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button variant="outline" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Coevaluación
                </Button>
            </CardFooter>
        </Card>
    )
}
