"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProfessors } from "@/services/professors"
import { getFeedback, getAverageRatings } from "@/services/feedback"
import { getSubjectsByProfessorId } from "@/services/subjects"
import type { Feedback, ProfessorService, SubjectService } from "@/lib/@types/services"
import type { FeedbackState } from "@/lib/@types/types"

const timeframes = [{ id: "all", name: "Todo el Tiempo" }]

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
}

const FeedbackPage = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [options, setOptions] = useState<FeedbackState>({} as FeedbackState)

    const handleSelectChange = (key: keyof FeedbackState, value: any) => {
        setOptions((previous) => ({
            ...previous,
            [key]: value,
        }))
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
            if (!options?.professor) return
            const subjects = await getSubjectsByProfessorId(options.professor)
            setSubjects(subjects)
        }
        fetchSubjects()
    }, [options?.professor])

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!options?.professor || !options?.subject) return
            const [feedback, averageRating] = await Promise.all([
                getFeedback(options.professor, options.subject),
                getAverageRatings(options.professor, options.subject),
            ])
            setFeedback(feedback)
            setOptions((previous) => ({ ...previous, averageRating }))
        }
        fetchFeedback()
    }, [options?.professor, options?.subject])

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Revisión de Retroalimentación</h2>
                <p className="text-muted-foreground">Revisar la retroalimentación proporcionada por los estudiantes</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="selectedProfessor">Profesor</Label>
                    <Select value={options.professor} onValueChange={(value) => handleSelectChange("professor", value)}>
                        <SelectTrigger id="selectedProfessor">
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
                    <Label htmlFor="selectedSubject">Materia</Label>
                    <Select
                        value={options.subject}
                        disabled={!options?.professor}
                        onValueChange={(value) => handleSelectChange("subject", value)}
                    >
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
            <Tabs className="w-full" defaultValue="summary">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary" disabled={!options.professor || !options.subject}>
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="comments" disabled={!options.professor || !options.subject}>
                        Comentarios
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Calificación General</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-5xl font-bold">{options.averageRating}</span>
                                    <span className="text-2xl text-muted-foreground">/5</span>
                                    <p className="text-sm text-muted-foreground">Basado en evaluaciones de estudiantes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle>Participación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <span className="text-3xl font-bold">{feedback.length ?? 0}</span>
                                    <p className="text-sm text-muted-foreground">Total de Evaluaciones</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="comments" className="space-y-4 pt-4">
                    {feedback.length === 0 && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay comentarios disponibles</p>
                        </div>
                    )}
                    {feedback.map(({ id, feedback_text, feedback_date, professor, subject, rating }) => (
                        <Card key={id}>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                {professor.first_name} {professor.last_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{subject.name}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1 font-medium">{rating}/10</span>
                                            <span className="text-xs text-muted-foreground">{feedback_date}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm">{feedback_text}</p>
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
