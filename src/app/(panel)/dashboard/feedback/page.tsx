"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProfessors } from "@/services/professors"
import { getFeedback } from "@/services/feedback"
import { getSubjectsByProfessorId } from "@/services/subjects"
import type { FeedbackState } from "@/lib/@types/types"
import type { Feedback, ProfessorService, SubjectService } from "@/lib/@types/services"
import { cn, createPeriods, filterByPeriod, getAverageRatings, ratingFeedback } from "@/lib/utils"

const timeframes = createPeriods(new Date("2024-01-01"))

const initialState = {
    timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
} as FeedbackState

const FeedbackPage = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [options, setOptions] = useState<FeedbackState>(initialState)
    const [ratings, setRatings] = useState<ReturnType<typeof ratingFeedback>>([])

    const optionsDisabled = !options.professorId || !options.subjectId
    const defaultCardMessage =
        !options.professorId && !options.subjectId
            ? "Por favor selecciona un profesor y una materia para ver la retroalimentación."
            : !options.professorId
              ? "Por favor selecciona un profesor para ver la retroalimentación."
              : subjects.length === 0
                ? "El profesor seleccionado no tiene materias asignadas."
                : !options.subjectId
                  ? "Por favor selecciona una materia para ver la retroalimentación."
                  : "success"

    const fileteredFeedback = filterByPeriod(feedback, options.timeframe)
    const avgRating = getAverageRatings(fileteredFeedback)
    const isEmptyFeedback = fileteredFeedback.length === 0

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
            if (!options?.professorId) return
            const subjects = await getSubjectsByProfessorId(options.professorId)
            setSubjects(subjects)
        }
        fetchSubjects()
    }, [options?.professorId])

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!options?.professorId || !options?.subjectId) return
            const feedback = await getFeedback(options.professorId, options.subjectId)
            setFeedback(feedback)
            setRatings(ratingFeedback(feedback))
        }
        fetchFeedback()
    }, [options?.professorId, options?.subjectId])

    useEffect(() => {
        const ratings = ratingFeedback(fileteredFeedback)
        setRatings(ratings)
    }, [options.timeframe])

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Revisión de Retroalimentación</h2>
                <p className="text-muted-foreground">Revisar la retroalimentación proporcionada por los estudiantes</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="selectedProfessor">Profesor</Label>
                    <Select value={options.professorId} onValueChange={(value) => handleSelectChange("professorId", value)}>
                        <SelectTrigger id="selectedProfessor">
                            <SelectValue placeholder="Selecciona un profesor" />
                        </SelectTrigger>
                        <SelectContent>
                            {professors.map((professorId) => (
                                <SelectItem key={professorId.id} value={professorId.id}>
                                    {professorId.first_name} {professorId.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="selectedSubject">Materia</Label>
                    <Select
                        value={options.subjectId}
                        disabled={!options?.professorId || subjects.length === 0}
                        onValueChange={(value) => handleSelectChange("subjectId", value)}
                    >
                        <SelectTrigger id="selectedSubject">
                            <SelectValue placeholder="Selecciona una materia" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subjectId) => (
                                <SelectItem key={subjectId.id} value={subjectId.id}>
                                    {subjectId.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timeframe">Periodo de Tiempo</Label>
                    <Select value={options.timeframe} onValueChange={(value) => handleSelectChange("timeframe", value)}>
                        <SelectTrigger id="timeframe">
                            <SelectValue placeholder="Selecciona un periodo de tiempo" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeframes.map(({ name, start, end }, index) => (
                                <SelectItem key={index} value={`${start.toISOString()} - ${end.toISOString()}`}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Tabs className="w-full" defaultValue="summary">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary" disabled={optionsDisabled}>
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="ratings" disabled={optionsDisabled}>
                        Indices
                    </TabsTrigger>
                    <TabsTrigger value="comments" disabled={optionsDisabled}>
                        Comentarios
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="summary" className="space-y-4 pt-4">
                    {defaultCardMessage !== "success" && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p
                                className={cn("text-sm text-muted-foreground", {
                                    "text-destructive": options.professorId && subjects.length === 0,
                                })}
                            >
                                {defaultCardMessage}
                            </p>
                        </div>
                    )}
                    {defaultCardMessage === "success" && (
                        <>
                            {isEmptyFeedback ? (
                                <div className="flex items-center justify-center w-full h-32">
                                    <p className="text-sm text-muted-foreground">No hay comentarios disponibles</p>
                                </div>
                            ) : (
                                <>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle>Calificación General</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-center">
                                                <div className="text-center">
                                                    <span className="text-5xl font-bold">{avgRating}</span>
                                                    <span className="text-2xl text-muted-foreground">/5</span>
                                                    <p className="text-sm text-muted-foreground">
                                                        Basado en evaluaciones de estudiantes
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle>Participación</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-center">
                                                    <span className="text-3xl font-bold">{fileteredFeedback.length ?? 0}</span>
                                                    <p className="text-sm text-muted-foreground">Total de Evaluaciones</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </TabsContent>
                <TabsContent value="ratings" className="space-y-4 pt-4">
                    {isEmptyFeedback && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay comentarios disponibles</p>
                        </div>
                    )}
                    {!isEmptyFeedback && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Indices</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {ratings.map(({ rating, percentage }) => (
                                    <div key={rating} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span>{rating} Stars</span>
                                            <span>{percentage}%</span>
                                        </div>
                                        <Progress value={parseInt(percentage)} className="h-2" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                <TabsContent value="comments" className="space-y-4 pt-4">
                    {isEmptyFeedback && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay comentarios disponibles</p>
                        </div>
                    )}
                    {fileteredFeedback.map(({ id, feedback_text, feedback_date, professor, subject, rating }) => (
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
