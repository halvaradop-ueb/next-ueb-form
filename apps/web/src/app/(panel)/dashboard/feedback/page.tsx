"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FeedbackState } from "@/lib/@types/types"
import type { Feedback, ProfessorService, SubjectService } from "@/lib/@types/services"
import { cn, createPeriods, filterByPeriod, getAverageRatings, ratingFeedback } from "@/lib/utils"
import { getProfessors } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { getFeedback } from "@/services/feedback"
import { getAutoEvaluationAnswers, type AutoEvaluationAnswer } from "@/services/auto-evaluation"

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
    const [autoEvaluationAnswers, setAutoEvaluationAnswers] = useState<AutoEvaluationAnswer[]>([])

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

    const filteredFeedback = filterByPeriod(feedback, options.timeframe)
    const avgRating = getAverageRatings(filteredFeedback)
    const isEmptyFeedback = filteredFeedback.length === 0

    const handleSelectChange = (key: keyof FeedbackState, value: any) => {
        setOptions((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const professorsData = await getProfessors()
                setProfessors(professorsData)
            } catch (err) {
                console.error("Fetch error:", err)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!options?.professorId) return

            console.log("Fetching subjects for professor ID:", options.professorId)
            console.log("Type of professor ID:", typeof options.professorId)
            console.log(
                "Is professor ID a valid UUID:",
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.professorId)
            )

            try {
                const subjectsData = await getSubjectsByProfessorId(options.professorId)
                setSubjects(subjectsData)
            } catch (err) {
                console.error("Fetch error:", err)
            }
        }

        fetchSubjects()
    }, [options?.professorId])

    useEffect(() => {
        const fetchFeedback = async () => {
            if (!options?.professorId || !options?.subjectId) return
            const feedbackData = await getFeedback(options.professorId, options.subjectId)
            setFeedback(feedbackData)
            setRatings(ratingFeedback(feedbackData))
        }
        fetchFeedback()
    }, [options?.professorId, options?.subjectId])

    useEffect(() => {
        const fetchAutoEvaluation = async () => {
            if (!options?.professorId || !options?.subjectId) return

            try {
                const autoEvaluationData = await getAutoEvaluationAnswers(options.professorId, options.subjectId)
                setAutoEvaluationAnswers(autoEvaluationData)
            } catch (error) {
                console.error("Error in fetchAutoEvaluation:", error)
                setAutoEvaluationAnswers([])
            }
        }
        fetchAutoEvaluation()
    }, [options?.professorId, options?.subjectId])

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
                                <SelectItem key={`timeframe-${name}`} value={`${start.toISOString()} - ${end.toISOString()}`}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Tabs className="w-full" defaultValue="summary">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary" disabled={optionsDisabled}>
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="ratings" disabled={optionsDisabled}>
                        Indices
                    </TabsTrigger>
                    <TabsTrigger value="comments" disabled={optionsDisabled}>
                        Comentarios
                    </TabsTrigger>
                    <TabsTrigger value="autoevaluation" disabled={optionsDisabled}>
                        Autoevaluación
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
                                                    <span className="text-3xl font-bold">{filteredFeedback.length ?? 0}</span>
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
                                            <span>{rating} Puntos</span>
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
                    {filteredFeedback.map((item: Feedback) => (
                        <Card key={item.id}>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                {item.professor.first_name} {item.professor.last_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{item.subject.name}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1 font-medium">{item.rating}/10</span>
                                            <span className="text-xs text-muted-foreground">{item.feedback_date}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm">{item.feedback_text}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
                <TabsContent value="autoevaluation" className="space-y-4 pt-4">
                    <div className="flex items-center justify-center w-full h-32">
                        <div className="text-center">
                            <p className="text-lg font-medium">🔍 Debug Autoevaluación</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Profesor ID: {options.professorId || "No seleccionado"}
                            </p>
                            <p className="text-sm text-muted-foreground">Materia ID: {options.subjectId || "No seleccionado"}</p>
                            <p className="text-sm text-muted-foreground">
                                Datos cargados: {autoEvaluationAnswers.length} respuestas
                            </p>
                            <div className="mt-4">
                                <p className="text-xs text-muted-foreground">Datos de ejemplo:</p>
                                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(autoEvaluationAnswers.slice(0, 2), null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                    {autoEvaluationAnswers.length === 0 && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay respuestas de autoevaluación disponibles</p>
                        </div>
                    )}
                    {autoEvaluationAnswers.map((answer: AutoEvaluationAnswer) => (
                        <Card key={answer.id}>
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Respuesta de Autoevaluación</p>
                                            <p className="text-sm text-muted-foreground">ID de respuesta: {answer.answer_id}</p>
                                        </div>
                                        <div className="text-xs text-muted-foreground">Semestre: {answer.semester}</div>
                                    </div>
                                    <div className="bg-muted p-3 rounded-md">
                                        <p className="text-sm">{answer.answer_text}</p>
                                    </div>
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
