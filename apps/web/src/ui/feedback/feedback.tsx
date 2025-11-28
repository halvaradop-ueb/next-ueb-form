"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts"
import type { FeedbackState } from "@/lib/@types/types"
import type { Feedback, ProfessorService, SubjectService, AutoEvaluationBySemester, Question } from "@/lib/@types/services"
import { cn, createPeriods, filterByPeriod, getAverageRatings, ratingFeedback, formatSemester } from "@/lib/utils"
import { getProfessors, getAllCoevaluations } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { getFeedback } from "@/services/feedback"
import { getAutoEvaluationAnswers } from "@/services/auto-evaluation"
import { getQuestionsBySubject } from "@/services/questions"
import { getStudentEvaluationsBySubject } from "@/services/answer"
import { API_ENDPOINT } from "@/services/utils"
import { generateFeedbackPDF } from "./generateFeedbackPDF"

const timeframes = createPeriods(new Date("2023-01-01"))

const initialState = {
    professorId: "",
    subjectId: "",
    timeframe: (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const semester = month >= 7 ? 2 : 1
        const startMonth = semester === 1 ? 1 : 7
        const startDate = new Date(year, startMonth - 1, 1)
        const endDate = semester === 1 ? new Date(year, 6, 30) : new Date(year, 11, 31)
        return `${startDate.toISOString()} - ${endDate.toISOString()}`
    })(),
} as FeedbackState

const getQuestionsByType = (questions: Question[]) => {
    const numericQuestions = questions.filter((q) => q.question_type === "numeric")
    const textQuestions = questions.filter((q) => q.question_type === "text")
    return { numericQuestions, textQuestions }
}

const getStudentEvaluationsByQuestionType = async (
    questions: Question[],
    subjectId: string,
    filteredEvaluations: Array<{ question_id: string; response: string; id_professor: string; semester?: string }>
): Promise<{
    numericResponses: Array<{ question: Question; responses: number[] }>
    textResponses: Array<{ question: Question; responses: string[] }>
}> => {
    const { numericQuestions, textQuestions } = getQuestionsByType(questions)

    const numericResponses: Array<{ question: Question; responses: number[] }> = []
    const textResponses: Array<{ question: Question; responses: string[] }> = []

    try {
        const evaluationsByQuestion = new Map<string, any[]>()
        filteredEvaluations.forEach((evaluationItem: any) => {
            if (!evaluationsByQuestion.has(evaluationItem.question_id)) {
                evaluationsByQuestion.set(evaluationItem.question_id, [])
            }
            evaluationsByQuestion.get(evaluationItem.question_id)!.push(evaluationItem)
        })
        numericQuestions.forEach((question) => {
            const questionEvaluations = evaluationsByQuestion.get(question.id) || []
            const numericValues = questionEvaluations
                .map((evaluationItem: any) => parseFloat(evaluationItem.response))
                .filter((val: number) => !isNaN(val))

            if (numericValues.length > 0) {
                numericResponses.push({ question, responses: numericValues })
            }
        })

        // Process text questions
        textQuestions.forEach((question) => {
            const questionEvaluations = evaluationsByQuestion.get(question.id) || []
            const textValues = questionEvaluations
                .map((evaluationItem: any) => evaluationItem.response)
                .filter((response: string) => response.trim() !== "")

            if (textValues.length > 0) {
                textResponses.push({ question, responses: textValues })
            }
        })
    } catch (error) {
        return { numericResponses: [], textResponses: [] }
    }

    return { numericResponses, textResponses }
}
export const FeedbackManagement = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [options, setOptions] = useState<FeedbackState>(initialState)
    const [ratings, setRatings] = useState<ReturnType<typeof ratingFeedback>>([])
    const [autoEvaluationAnswers, setAutoEvaluationAnswers] = useState<AutoEvaluationBySemester[]>([])
    const [questions, setQuestions] = useState<Question[]>([])
    const [studentEvaluations, setStudentEvaluations] = useState<{
        numericResponses: Array<{ question: Question; responses: number[] }>
        textResponses: Array<{ question: Question; responses: string[] }>
    }>({ numericResponses: [], textResponses: [] })
    const [coevaluations, setCoevaluations] = useState<any[]>([])

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
                // Fetch error handled silently
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!options?.professorId) return
            try {
                const subjectsData = await getSubjectsByProfessorId(options.professorId)
                setSubjects(subjectsData)
            } catch (err) {
                // Error handled silently
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

                // Apply semester filter if a specific timeframe is selected
                let filteredAutoEvaluations = autoEvaluationData
                if (options.timeframe && options.timeframe !== "2023-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z") {
                    let targetSemester = ""
                    const parts = options.timeframe.split(" - ")
                    if (parts.length >= 2) {
                        const firstPart = parts[0]
                        if (firstPart.includes("T")) {
                            // Parse ISO date and determine semester
                            const date = new Date(firstPart)
                            const year = date.getFullYear()
                            const month = date.getMonth() + 1
                            targetSemester = month >= 7 ? `${year} - 2` : `${year} - 1`
                        } else {
                            // Already in semester format
                            targetSemester = firstPart
                        }
                    }

                    // Filter autoevaluations by semester
                    if (targetSemester) {
                        filteredAutoEvaluations = autoEvaluationData.filter((autoEvaluation: any) => {
                            // Filter by semester - check if it's grouped data or individual answers
                            if (autoEvaluation.semester) {
                                return autoEvaluation.semester === targetSemester
                            } else if (autoEvaluation.answers && Array.isArray(autoEvaluation.answers)) {
                                // If it's grouped data, filter the groups
                                return autoEvaluation.semester === targetSemester
                            }
                            return false
                        })
                    }
                }

                setAutoEvaluationAnswers(filteredAutoEvaluations)
            } catch (error) {
                setAutoEvaluationAnswers([])
            }
        }
        fetchAutoEvaluation()
    }, [options?.professorId, options?.subjectId, options?.timeframe])

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!options?.subjectId) return

            try {
                const questionsData = await getQuestionsBySubject(options.subjectId)

                // If no questions found for this subject, try getting all questions as fallback
                if (!questionsData || questionsData.length === 0) {
                    const allQuestionsResponse = await fetch(`${API_ENDPOINT}/questions`)
                    const allQuestionsData = await allQuestionsResponse.json()
                    const allQuestions = Array.isArray(allQuestionsData.questions) ? allQuestionsData.questions : []
                    setQuestions(allQuestions)
                } else {
                    setQuestions(questionsData)
                }
            } catch (error) {
                setQuestions([])
            }
        }
        fetchQuestions()
    }, [options?.subjectId])

    useEffect(() => {
        const fetchStudentEvaluations = async () => {
            if (questions.length === 0 || !options?.subjectId) {
                return
            }

            try {
                const allEvaluations = await getStudentEvaluationsBySubject(options.subjectId, "", options.professorId)
                const isDefaultTimeframe = options.timeframe === "2023-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z"

                let filteredEvaluations = allEvaluations

                if (!isDefaultTimeframe && options.timeframe && options.timeframe.includes(" - ")) {
                    let targetSemester = ""
                    const parts = options.timeframe.split(" - ")
                    if (parts.length >= 2) {
                        const firstPart = parts[0]
                        if (firstPart.includes("T")) {
                            // Parse ISO date and determine semester
                            const date = new Date(firstPart)
                            const year = date.getFullYear()
                            const month = date.getMonth() + 1
                            targetSemester = month >= 7 ? `${year} - 2` : `${year} - 1`
                        } else {
                            // Already in semester format
                            targetSemester = firstPart
                        }
                    }

                    // Filter evaluations by semester only if we have a specific target semester
                    if (targetSemester) {
                        filteredEvaluations = allEvaluations.filter(
                            (evaluationItem) => evaluationItem.semester === targetSemester
                        )
                    }
                }
                const data = await getStudentEvaluationsByQuestionType(questions, options.subjectId, filteredEvaluations)
                setStudentEvaluations(data)
            } catch (error) {
                setStudentEvaluations({ numericResponses: [], textResponses: [] })
            }
        }

        fetchStudentEvaluations()
    }, [questions, options?.subjectId, options?.professorId, options?.timeframe])

    useEffect(() => {
        const fetchCoevaluations = async () => {
            try {
                const coevaluationData = await getAllCoevaluations(options.professorId, options.subjectId)

                // Apply semester filter if a specific timeframe is selected
                let filteredCoevaluations = coevaluationData
                if (options.timeframe && options.timeframe !== "2023-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z") {
                    let targetSemester = ""
                    const parts = options.timeframe.split(" - ")
                    if (parts.length >= 2) {
                        const firstPart = parts[0]
                        if (firstPart.includes("T")) {
                            // Parse ISO date and determine semester
                            const date = new Date(firstPart)
                            const year = date.getFullYear()
                            const month = date.getMonth() + 1
                            targetSemester = month >= 7 ? `${year} - 2` : `${year} - 1`
                        } else {
                            // Already in semester format
                            targetSemester = firstPart
                        }
                    }

                    // Filter coevaluations by semester
                    if (targetSemester) {
                        filteredCoevaluations = coevaluationData.filter((coevaluation: any) => {
                            // Extract semester from the timeframe field
                            if (coevaluation.semestre) {
                                // Convert stored semester format to match target format
                                const storedSemester = coevaluation.semestre.split(" - ")[0] // Get "2025-07-02T00:00:00.000Z"
                                const storedDate = new Date(storedSemester)
                                const storedYear = storedDate.getFullYear()
                                const storedMonth = storedDate.getMonth() + 1
                                const storedSemesterPeriod = storedMonth >= 7 ? `${storedYear} - 2` : `${storedYear} - 1`

                                return storedSemesterPeriod === targetSemester
                            }
                            return false
                        })
                    }
                }

                setCoevaluations(filteredCoevaluations)
            } catch (error) {
                setCoevaluations([])
            }
        }

        fetchCoevaluations()
    }, [options?.professorId, options?.subjectId, options?.timeframe])

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Revisión de Retroalimentación</h2>
                    <p className="text-muted-foreground">Revisar la retroalimentación proporcionada por los estudiantes</p>
                </div>
                <Button
                    onClick={async () => {
                        try {
                            // Show loading state
                            const button = document.querySelector("[data-pdf-button]") as HTMLButtonElement
                            if (button) {
                                button.innerHTML =
                                    '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Generando PDF...'
                                button.disabled = true
                            }

                            // Verificar que tenemos datos antes de generar
                            if (studentEvaluations.numericResponses.length === 0 && feedback.length === 0) {
                                alert(
                                    "No hay datos disponibles para generar el PDF. Por favor, asegúrese de que la información se haya cargado completamente."
                                )
                                if (button) {
                                    button.innerHTML =
                                        '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Generar PDF'
                                    button.disabled = false
                                }
                                return
                            }

                            // Calculate semester averages for the PDF timeline (using ALL feedback, not filtered)
                            const semesterAveragesData = (() => {
                                // Group ALL feedback by semester (ignoring time filter)
                                const feedbackBySemester = feedback.reduce(
                                    (acc, item) => {
                                        // Extract semester from feedback_date
                                        const date = new Date(item.feedback_date)
                                        const year = date.getFullYear()
                                        const month = date.getMonth() + 1
                                        const semester = month >= 7 ? `${year}-2` : `${year}-1`

                                        if (!acc[semester]) {
                                            acc[semester] = []
                                        }
                                        acc[semester].push(item)
                                        return acc
                                    },
                                    {} as Record<string, typeof feedback>
                                )

                                return Object.entries(feedbackBySemester)
                                    .map(([semester, semesterFeedback]) => {
                                        const avg =
                                            semesterFeedback.reduce((sum, item) => sum + item.rating, 0) / semesterFeedback.length
                                        return {
                                            semester,
                                            average: avg,
                                            universityAverage: avg,
                                            count: semesterFeedback.length,
                                            semesterName: `Semestre ${semester.replace("-", " - ")}`,
                                        }
                                    })
                                    .sort((a, b) => a.semester.localeCompare(b.semester))
                            })()

                            // Generate PDF directly with available data
                            await generateFeedbackPDF(
                                professors,
                                subjects,
                                options,
                                feedback,
                                ratings,
                                autoEvaluationAnswers,
                                coevaluations,
                                studentEvaluations,
                                questions,
                                semesterAveragesData
                            )

                            // Show success feedback
                            if (button) {
                                button.innerHTML =
                                    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ¡PDF Generado!'
                                setTimeout(() => {
                                    button.innerHTML =
                                        '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Generar PDF'
                                    button.disabled = false
                                }, 2000)
                            }
                        } catch (error) {
                            // Show error message to user
                            const errorMessage = error instanceof Error ? error.message : "Error desconocido"
                            alert(`Error generando PDF: ${errorMessage}`)

                            // Restore button state on error
                            const button = document.querySelector("[data-pdf-button]") as HTMLButtonElement
                            if (button) {
                                button.innerHTML =
                                    '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Generar PDF'
                                button.disabled = false
                            }
                        }
                    }}
                    disabled={optionsDisabled}
                    className="flex items-center gap-2"
                    data-pdf-button
                >
                    <Download className="h-4 w-4" />
                    Generar PDF
                </Button>
            </div>
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="selectedProfessor">Profesor</Label>
                        <Select
                            value={options.professorId ?? ""}
                            onValueChange={(value) => handleSelectChange("professorId", value)}
                        >
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
                            value={options.subjectId ?? ""}
                            disabled={!options?.professorId || subjects.length === 0}
                            onValueChange={(value) => handleSelectChange("subjectId", value)}
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
                        <Select value={options.timeframe ?? ""} onValueChange={(value) => handleSelectChange("timeframe", value)}>
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
            </div>
            <Tabs className="w-full" defaultValue="summary">
                <TabsList className="grid w-full grid-cols-6">
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
                    <TabsTrigger value="coevaluation">Coevaluación</TabsTrigger>
                    <TabsTrigger value="comparative" disabled={optionsDisabled}>
                        Análisis Comparativo
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
                                    {/* Semester Grade History - University Scale (1-5) */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="flex items-center gap-2">
                                                📈 Historia de Notas por Semestre
                                            </CardTitle>
                                            <CardDescription>
                                                Evolución del promedio de calificaciones en escala universitaria (1-5)
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {(() => {
                                                // Group feedback by semester
                                                const feedbackBySemester = filteredFeedback.reduce(
                                                    (acc, item) => {
                                                        // Extract semester from feedback_date
                                                        const date = new Date(item.feedback_date)
                                                        const year = date.getFullYear()
                                                        const month = date.getMonth() + 1
                                                        const semester = month >= 7 ? `${year}-2` : `${year}-1`

                                                        if (!acc[semester]) {
                                                            acc[semester] = []
                                                        }
                                                        acc[semester].push(item)
                                                        return acc
                                                    },
                                                    {} as Record<string, typeof filteredFeedback>
                                                )

                                                const semesterAverages = Object.entries(feedbackBySemester)
                                                    .map(([semester, semesterFeedback]) => {
                                                        const avg =
                                                            semesterFeedback.reduce(
                                                                (sum: number, item: any) => sum + item.rating,
                                                                0
                                                            ) / semesterFeedback.length
                                                        // Convert from 1-10 scale to 1-5 university scale
                                                        const universityAvg = avg / 2
                                                        return {
                                                            semester,
                                                            average: avg,
                                                            universityAverage: avg,
                                                            count: semesterFeedback.length,
                                                            semesterName: `Semestre ${semester.replace("-", " - ")}`,
                                                        }
                                                    })
                                                    .sort((a, b) => a.semester.localeCompare(b.semester))

                                                if (semesterAverages.length === 0) {
                                                    return (
                                                        <div className="text-center py-8">
                                                            <p className="text-muted-foreground">
                                                                No hay datos de evaluaciones por semestre
                                                            </p>
                                                        </div>
                                                    )
                                                }

                                                // Prepare data for the chart
                                                const chartData = semesterAverages.map(({ semesterName, average, count }) => ({
                                                    semester: semesterName,
                                                    promedio: Number(average.toFixed(2)),
                                                    evaluaciones: count,
                                                }))

                                                return (
                                                    <div className="space-y-6">
                                                        {/* Grade Trend Chart */}
                                                        <div className="h-64 w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart
                                                                    data={chartData}
                                                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                                >
                                                                    <XAxis
                                                                        dataKey="semester"
                                                                        angle={-45}
                                                                        textAnchor="end"
                                                                        height={80}
                                                                        fontSize={12}
                                                                    />
                                                                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                                                                    <Tooltip
                                                                        formatter={(value, name) => [
                                                                            name === "promedio"
                                                                                ? [
                                                                                      `${Number(value).toFixed(2)}/5`,
                                                                                      "Promedio Universitario",
                                                                                  ]
                                                                                : [value, "Evaluaciones"],
                                                                            name === "promedio" ? "Promedio" : "Total",
                                                                        ]}
                                                                        labelFormatter={(label) => `Período: ${label}`}
                                                                    />
                                                                    <Line
                                                                        type="monotone"
                                                                        dataKey="promedio"
                                                                        stroke="#3b82f6"
                                                                        strokeWidth={3}
                                                                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                                                                        activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 2 }}
                                                                    />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        </div>

                                                        {/* Statistics Summary */}
                                                        <div className="grid gap-4 md:grid-cols-3">
                                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                                <div className="text-lg font-bold text-blue-600">
                                                                    {(
                                                                        semesterAverages.reduce(
                                                                            (sum: number, item: any) =>
                                                                                sum + item.universityAverage,
                                                                            0
                                                                        ) / semesterAverages.length
                                                                    ).toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-blue-700">Promedio General</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                                <div className="text-lg font-bold text-green-600">
                                                                    {Math.max(
                                                                        ...semesterAverages.map((item) => item.universityAverage)
                                                                    ).toFixed(2)}
                                                                </div>
                                                                <div className="text-xs text-green-700">Mejor Semestre</div>
                                                            </div>
                                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                                <div className="text-lg font-bold text-purple-600">
                                                                    {semesterAverages.length}
                                                                </div>
                                                                <div className="text-xs text-purple-700">Períodos Evaluados</div>
                                                            </div>
                                                        </div>

                                                        {/* Trend Indicator */}
                                                        {semesterAverages.length > 1 && (
                                                            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="font-medium text-blue-800">
                                                                        Tendencia General:
                                                                    </span>
                                                                    <span
                                                                        className={`font-bold ${
                                                                            semesterAverages[semesterAverages.length - 1]
                                                                                .universityAverage >
                                                                            semesterAverages[0].universityAverage
                                                                                ? "text-green-600"
                                                                                : "text-red-600"
                                                                        }`}
                                                                    >
                                                                        {semesterAverages[semesterAverages.length - 1]
                                                                            .universityAverage >
                                                                        semesterAverages[0].universityAverage
                                                                            ? "↗"
                                                                            : "↘"}
                                                                        {Math.abs(
                                                                            semesterAverages[semesterAverages.length - 1]
                                                                                .universityAverage -
                                                                                semesterAverages[0].universityAverage
                                                                        ).toFixed(2)}{" "}
                                                                        puntos
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </>
                    )}
                </TabsContent>
                <TabsContent value="ratings" className="space-y-4 pt-4">
                    {questions.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay preguntas disponibles para esta materia</p>
                        </div>
                    ) : (
                        <>
                            {/* Student Evaluation Visualizations with Charts */}
                            {studentEvaluations.numericResponses.length > 0 && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-primary mb-2">
                                                📊 Análisis Estadístico Completo
                                            </h3>
                                            <p className="text-muted-foreground">
                                                Visualización avanzada de métricas y tendencias de evaluación
                                            </p>
                                        </div>

                                        {/* Overall Statistics Banner */}
                                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                                            <div className="grid gap-4 md:grid-cols-4 text-center">
                                                <div>
                                                    <div className="text-2xl font-bold text-primary">
                                                        {studentEvaluations.numericResponses.reduce(
                                                            (acc, item) => acc + item.responses.length,
                                                            0
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Total Respuestas</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {(() => {
                                                            const allResponses = studentEvaluations.numericResponses.flatMap(
                                                                (item) => item.responses
                                                            )
                                                            const validResponses = allResponses.filter((r) => r > 0)
                                                            return validResponses.length > 0
                                                                ? (
                                                                      validResponses.reduce((a, b) => a + b, 0) /
                                                                      validResponses.length
                                                                  ).toFixed(1)
                                                                : "0.0"
                                                        })()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Promedio General</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {studentEvaluations.numericResponses.length}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Preguntas Numéricas</div>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold text-purple-600">
                                                        {studentEvaluations.textResponses.length}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Preguntas de Texto</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Cards */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-blue-800">
                                                    Total Respuestas
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {studentEvaluations.numericResponses.reduce(
                                                        (acc, item) => acc + item.responses.length,
                                                        0
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-green-800">
                                                    Preguntas Numéricas
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-green-600">
                                                    {studentEvaluations.numericResponses.length}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium text-purple-800">
                                                    Preguntas de Texto
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {studentEvaluations.textResponses.length}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Enhanced Statistical Charts Section */}
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        {/* Overall Performance Overview */}
                                        <Card className="lg:col-span-2">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    📊 Análisis Estadístico General
                                                </CardTitle>
                                                <CardDescription>
                                                    Vista completa del rendimiento de las evaluaciones
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    {/* Score Distribution */}
                                                    <div className="space-y-2">
                                                        <h4 className="font-semibold text-sm">Distribución de Calificaciones</h4>
                                                        <div className="h-48">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={[
                                                                            {
                                                                                name: "5 (Excelente)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter((r) => r === 5)
                                                                                            .length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "4 (Muy Bueno)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter((r) => r === 4)
                                                                                            .length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "3 (Bueno)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter((r) => r === 3)
                                                                                            .length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "2 (Regular)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter((r) => r === 2)
                                                                                            .length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "1 (Deficiente)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter((r) => r === 1)
                                                                                            .length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "0 (No aplica)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter((r) => r === 0)
                                                                                            .length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                        ].filter((item) => item.value > 0)}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={({ name, percent }) =>
                                                                            `${(Number(percent) * 100).toFixed(0)}%`
                                                                        }
                                                                        outerRadius={60}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                    >
                                                                        {[
                                                                            "#22c55e",
                                                                            "#84cc16",
                                                                            "#eab308",
                                                                            "#ef4444",
                                                                            "#6b7280",
                                                                        ].map((color, index) => (
                                                                            <Cell key={`cell-${index}`} fill={color} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>

                                                    {/* Statistical Summary */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold text-sm">Resumen Estadístico</h4>
                                                        {(() => {
                                                            const allResponses = studentEvaluations.numericResponses.flatMap(
                                                                (item) => item.responses
                                                            )
                                                            const validResponses = allResponses.filter((r) => r > 0)
                                                            if (validResponses.length === 0)
                                                                return (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        No hay datos disponibles
                                                                    </p>
                                                                )

                                                            const avg =
                                                                validResponses.reduce((a, b) => a + b, 0) / validResponses.length
                                                            const min = Math.min(...validResponses)
                                                            const max = Math.max(...validResponses)
                                                            const median = validResponses.sort((a, b) => a - b)[
                                                                Math.floor(validResponses.length / 2)
                                                            ]

                                                            return (
                                                                <div className="space-y-3">
                                                                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                                                        <span className="text-sm font-medium">
                                                                            Promedio General:
                                                                        </span>
                                                                        <span className="text-lg font-bold text-blue-600">
                                                                            {avg.toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                                                                        <span className="text-sm font-medium">Mediana:</span>
                                                                        <span className="text-lg font-bold text-green-600">
                                                                            {median.toFixed(1)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                                                        <span className="text-sm font-medium">Rango:</span>
                                                                        <span className="text-lg font-bold text-purple-600">
                                                                            {min} - {max}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                                                        <span className="text-sm font-medium">
                                                                            Total Evaluaciones:
                                                                        </span>
                                                                        <span className="text-lg font-bold text-orange-600">
                                                                            {allResponses.length}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Performance Trends */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    📈 Tendencias de Desempeño
                                                </CardTitle>
                                                <CardDescription>Evolución del rendimiento promedio por pregunta</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={studentEvaluations.numericResponses.map(
                                                                ({ question, responses }) => {
                                                                    const validResponses = responses.filter((r) => r > 0)
                                                                    return {
                                                                        name:
                                                                            question.title.length > 40
                                                                                ? question.title.substring(0, 40) + "..."
                                                                                : question.title,
                                                                        fullName: question.title,
                                                                        promedio:
                                                                            validResponses.length > 0
                                                                                ? validResponses.reduce((a, b) => a + b, 0) /
                                                                                  validResponses.length
                                                                                : 0,
                                                                        total: responses.length,
                                                                    }
                                                                }
                                                            )}
                                                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                        >
                                                            <XAxis
                                                                dataKey="name"
                                                                angle={-45}
                                                                textAnchor="end"
                                                                height={80}
                                                                fontSize={10}
                                                            />
                                                            <YAxis domain={[0, 5]} />
                                                            <Tooltip
                                                                formatter={(value, name, props) => [
                                                                    name === "promedio" ? `${Number(value).toFixed(1)}/5` : value,
                                                                    name === "promedio" ? "Promedio" : "Total Respuestas",
                                                                ]}
                                                                labelFormatter={(label, payload) => {
                                                                    if (payload && payload[0]) {
                                                                        return payload[0].payload.fullName
                                                                    }
                                                                    return label
                                                                }}
                                                                contentStyle={{ fontSize: "12px" }}
                                                            />
                                                            <Bar dataKey="promedio" fill="#8884d8" name="Promedio" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Score Distribution Histogram */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    📊 Histograma de Calificaciones
                                                </CardTitle>
                                                <CardDescription>
                                                    Distribución detallada de todas las calificaciones
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-64">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart
                                                            data={Array.from({ length: 6 }, (_, i) => {
                                                                const rating = i
                                                                const count = studentEvaluations.numericResponses.reduce(
                                                                    (acc, item) =>
                                                                        acc +
                                                                        item.responses.filter((r) => Math.floor(r) === rating)
                                                                            .length,
                                                                    0
                                                                )
                                                                return {
                                                                    calificacion: `${rating}`,
                                                                    cantidad: count,
                                                                    porcentaje:
                                                                        studentEvaluations.numericResponses.reduce(
                                                                            (acc, item) => acc + item.responses.length,
                                                                            0
                                                                        ) > 0
                                                                            ? (count /
                                                                                  studentEvaluations.numericResponses.reduce(
                                                                                      (acc, item) => acc + item.responses.length,
                                                                                      0
                                                                                  )) *
                                                                              100
                                                                            : 0,
                                                                }
                                                            }).filter((item) => item.cantidad > 0)}
                                                        >
                                                            <XAxis dataKey="calificacion" />
                                                            <YAxis />
                                                            <Tooltip
                                                                formatter={(value, name) => [
                                                                    name === "cantidad"
                                                                        ? `${value} respuestas`
                                                                        : `${Number(value).toFixed(1)}%`,
                                                                    name === "cantidad" ? "Cantidad" : "Porcentaje",
                                                                ]}
                                                            />
                                                            <Bar dataKey="cantidad" fill="#82ca9d" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Performance Categories */}
                                        <Card className="lg:col-span-2">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    🏆 Categorías de Desempeño
                                                </CardTitle>
                                                <CardDescription>
                                                    Clasificación del rendimiento general por niveles
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-4 md:grid-cols-6">
                                                    {[
                                                        {
                                                            label: "5 (Excelente)",
                                                            range: "5",
                                                            color: "bg-green-500",
                                                            bgColor: "bg-green-50",
                                                            textColor: "text-green-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) => acc + item.responses.filter((r) => r === 5).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "4 (Muy Bueno)",
                                                            range: "4",
                                                            color: "bg-blue-500",
                                                            bgColor: "bg-blue-50",
                                                            textColor: "text-blue-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) => acc + item.responses.filter((r) => r === 4).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "3 (Bueno)",
                                                            range: "3",
                                                            color: "bg-yellow-500",
                                                            bgColor: "bg-yellow-50",
                                                            textColor: "text-yellow-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) => acc + item.responses.filter((r) => r === 3).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "2 (Regular)",
                                                            range: "2",
                                                            color: "bg-orange-500",
                                                            bgColor: "bg-orange-50",
                                                            textColor: "text-orange-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) => acc + item.responses.filter((r) => r === 2).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "1 (Deficiente)",
                                                            range: "1",
                                                            color: "bg-red-500",
                                                            bgColor: "bg-red-50",
                                                            textColor: "text-red-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) => acc + item.responses.filter((r) => r === 1).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "0 (No aplica)",
                                                            range: "0",
                                                            color: "bg-gray-500",
                                                            bgColor: "bg-gray-50",
                                                            textColor: "text-gray-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) => acc + item.responses.filter((r) => r === 0).length,
                                                                0
                                                            ),
                                                        },
                                                    ].map((category, index) => {
                                                        const totalResponses = studentEvaluations.numericResponses.reduce(
                                                            (acc, item) => acc + item.responses.length,
                                                            0
                                                        )
                                                        const percentage =
                                                            totalResponses > 0 ? (category.count / totalResponses) * 100 : 0

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`${category.bgColor} p-4 rounded-lg border`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`text-sm font-medium ${category.textColor}`}>
                                                                        {category.label}
                                                                    </span>
                                                                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                                                                </div>
                                                                <div className="text-2xl font-bold mb-1">{category.count}</div>
                                                                <div className="text-xs text-muted-foreground mb-2">
                                                                    {category.range} puntos
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${category.color}`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {percentage.toFixed(1)}%
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Text Responses Section */}
                                    {studentEvaluations.textResponses.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    📝 Comentarios y Observaciones
                                                </CardTitle>
                                                <CardDescription>Respuestas cualitativas de los estudiantes</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-4 md:grid-cols-1">
                                                    {studentEvaluations.textResponses.map(({ question, responses }) => (
                                                        <div key={question.id} className="space-y-3">
                                                            <h4 className="font-semibold text-primary">{question.title}</h4>
                                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                                {responses.map((response, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="p-3 bg-muted rounded-lg border-l-4 border-l-primary"
                                                                    >
                                                                        <p className="text-sm leading-relaxed">{response}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {studentEvaluations.numericResponses.length === 0 &&
                                studentEvaluations.textResponses.length === 0 && (
                                    <div className="flex items-center justify-center w-full h-32">
                                        <p className="text-sm text-muted-foreground">
                                            No hay datos de evaluación disponibles para mostrar gráficos
                                        </p>
                                    </div>
                                )}
                        </>
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
                                            <span className="mr-1 font-medium">{item.rating}/5</span>
                                            <span className="text-xs text-muted-foreground">
                                                {item.feedback_date
                                                    ? new Date(item.feedback_date).toLocaleDateString("es-ES")
                                                    : "Sin fecha"}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm">{item.feedback_text}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
                <TabsContent value="autoevaluation" className="space-y-4 pt-4">
                    {autoEvaluationAnswers.length === 0 && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay respuestas de autoevaluación disponibles</p>
                        </div>
                    )}

                    {/* Check if data is already grouped by semester (from API) */}
                    {autoEvaluationAnswers.length > 0 && autoEvaluationAnswers[0] && "answers" in autoEvaluationAnswers[0]
                        ? // Data is already grouped by semester
                          autoEvaluationAnswers.map((semesterData, index) => {
                              return semesterData && semesterData.semester ? (
                                  <Card key={`${semesterData.semester}-${index}`} className="border-2 border-primary/10">
                                      <CardHeader className="bg-primary/5 border-b">
                                          <CardTitle className="text-xl text-primary flex items-center gap-2">
                                              📅 Semestre {semesterData.semester}
                                              <span className="text-sm font-normal text-muted-foreground ml-auto">
                                                  {semesterData.answers?.length || 0} respuestas
                                              </span>
                                          </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-6">
                                          {semesterData.answers &&
                                          Array.isArray(semesterData.answers) &&
                                          semesterData.answers.length > 0 ? (
                                              <div className="space-y-4">
                                                  {semesterData.answers.map((answer, answerIndex) => (
                                                      <div
                                                          key={answer.id || answerIndex}
                                                          className="border-l-4 border-l-primary/30 pl-4 py-3 bg-muted/30 rounded-r-lg"
                                                      >
                                                          <div className="space-y-3">
                                                              <div className="flex items-center justify-between">
                                                                  <div>
                                                                      <h4 className="font-semibold text-primary">
                                                                          {answer.question_title ||
                                                                              `Pregunta ${answer.answer_id}`}
                                                                      </h4>
                                                                  </div>
                                                                  <div className="text-right">
                                                                      <p className="text-xs text-muted-foreground">Profesor</p>
                                                                  </div>
                                                              </div>
                                                              <div className="bg-background p-4 rounded border">
                                                                  <p className="text-sm leading-relaxed">
                                                                      {answer.answer_text || "Sin respuesta"}
                                                                  </p>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          ) : (
                                              <div className="text-center py-8">
                                                  <p className="text-muted-foreground">
                                                      No hay respuestas disponibles para este semestre
                                                  </p>
                                              </div>
                                          )}
                                      </CardContent>
                                  </Card>
                              ) : null
                          })
                        : // Data is individual answers, need to group by semester
                          (() => {
                              if (!Array.isArray(autoEvaluationAnswers)) {
                                  return null
                              }

                              const groupedBySemester = autoEvaluationAnswers.reduce(
                                  (acc, item) => {
                                      if (!acc[item.semester]) acc[item.semester] = []
                                      acc[item.semester].push(item)
                                      return acc
                                  },
                                  {} as Record<string, any[]>
                              )

                              return Object.entries(groupedBySemester).map(([semester, answers]) => (
                                  <Card key={semester} className="border-2 border-primary/10">
                                      <CardHeader className="bg-primary/5 border-b">
                                          <CardTitle className="text-xl text-primary flex items-center gap-2">
                                              📅 Semestre {semester}
                                              <span className="text-sm font-normal text-muted-foreground ml-auto">
                                                  {answers.length} respuestas
                                              </span>
                                          </CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-6">
                                          <div className="space-y-4">
                                              {answers.map((answer: any, answerIndex: number) => (
                                                  <div
                                                      key={answer.id || answerIndex}
                                                      className="border-l-4 border-l-primary/30 pl-4 py-3 bg-muted/30 rounded-r-lg"
                                                  >
                                                      <div className="space-y-3">
                                                          <div className="flex items-center justify-between">
                                                              <div>
                                                                  <h4 className="font-semibold text-primary">
                                                                      {answer.question_title || `Pregunta ${answer.answer_id}`}
                                                                  </h4>
                                                                  <p className="text-sm text-muted-foreground">
                                                                      ID de respuesta: {answer.answer_id}
                                                                  </p>
                                                              </div>
                                                              <div className="text-right">
                                                                  <p className="text-xs text-muted-foreground">Profesor</p>
                                                                  <p className="text-xs font-mono">
                                                                      {answer.professor_id?.slice(0, 8) || "N/A"}...
                                                                  </p>
                                                              </div>
                                                          </div>
                                                          <div className="bg-background p-4 rounded border">
                                                              <p className="text-sm leading-relaxed">
                                                                  {answer.answer_text || "Sin respuesta"}
                                                              </p>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </CardContent>
                                  </Card>
                              ))
                          })()}
                </TabsContent>
                <TabsContent value="coevaluation" className="space-y-4 pt-4">
                    {coevaluations.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay datos de coevaluación disponibles</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-primary">📋 Coevaluaciones</h3>
                                <span className="text-sm text-muted-foreground">
                                    {coevaluations.length} registro{coevaluations.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {coevaluations.map((coevaluation) => (
                                    <Card key={coevaluation.id} className="border-2 border-primary/10">
                                        <CardHeader className="bg-primary/5 border-b">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg text-primary">
                                                    📅 Coevaluación{" "}
                                                    {coevaluation.semestre
                                                        ? formatSemester(coevaluation.semestre)
                                                        : "Sin semestre"}
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="space-y-4">
                                                {/* Professor and Subject Info */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-primary">👨‍🏫 Profesor:</span>
                                                            <span>
                                                                {coevaluation.professor
                                                                    ? `${coevaluation.professor.first_name} ${coevaluation.professor.last_name}`
                                                                    : `ID: ${coevaluation.professor_id.slice(0, 8)}...`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-primary">📚 Materia:</span>
                                                            <span>
                                                                {coevaluation.subject
                                                                    ? coevaluation.subject.name
                                                                    : `ID: ${coevaluation.subject_id.slice(0, 8)}...`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-primary">👤 Admin:</span>
                                                            <span>
                                                                {coevaluation.admin
                                                                    ? `${coevaluation.admin.first_name} ${coevaluation.admin.last_name}`
                                                                    : `ID: ${coevaluation.admin_id.slice(0, 8)}...`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-primary">📅 Semestre:</span>
                                                            <span>
                                                                {coevaluation.semestre
                                                                    ? formatSemester(coevaluation.semestre)
                                                                    : "Sin semestre"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Findings Section */}
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-primary flex items-center gap-2">
                                                        🔍 Hallazgos
                                                    </h4>
                                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-l-yellow-400">
                                                        <p className="text-sm leading-relaxed">{coevaluation.findings}</p>
                                                    </div>
                                                </div>

                                                {/* Improvement Plan Section */}
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-primary flex items-center gap-2">
                                                        📋 Plan de Mejoramiento
                                                    </h4>
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-l-blue-400">
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                            {coevaluation.improvement_plan}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="comparative" className="space-y-4 pt-4">
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
                        <ComparativeAnalysis
                            feedback={feedback}
                            studentEvaluations={studentEvaluations}
                            questions={questions}
                            professors={professors}
                            subjects={subjects}
                            options={options}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </section>
    )
}

const ComparativeAnalysis = ({
    feedback,
    studentEvaluations,
    questions,
    professors,
    subjects,
    options,
}: {
    feedback: Feedback[]
    studentEvaluations: any
    questions: Question[]
    professors: ProfessorService[]
    subjects: SubjectService[]
    options: FeedbackState
}) => {
    const [selectedSemesters, setSelectedSemesters] = useState<string[]>([])
    const [comparisonData, setComparisonData] = useState<any>(null)

    // Semestres disponibles
    const availableSemesters = useMemo(() => {
        const semesters = new Set<string>()
        feedback.forEach((item) => {
            const date = new Date(item.feedback_date)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const semester = month >= 7 ? `${year}-2` : `${year}-1`
            semesters.add(semester)
        })
        return Array.from(semesters).sort()
    }, [feedback])

    // Cálculo de métricas
    const calculateSemesterMetrics = useCallback((semesterFeedback: Feedback[]) => {
        if (semesterFeedback.length === 0) return null
        const ratings = semesterFeedback.map((f) => f.rating).filter((r) => typeof r === "number")
        if (ratings.length === 0) return null

        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length
        const sortedRatings = [...ratings].sort((a, b) => a - b)
        const median =
            sortedRatings.length % 2 === 0
                ? (sortedRatings[sortedRatings.length / 2 - 1] + sortedRatings[sortedRatings.length / 2]) / 2
                : sortedRatings[Math.floor(sortedRatings.length / 2)]

        // Calculate semester from the first feedback item
        const firstFeedback = semesterFeedback[0]
        let semester = "N/A"
        if (firstFeedback?.feedback_date) {
            const date = new Date(firstFeedback.feedback_date)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            semester = month >= 7 ? `${year}-2` : `${year}-1`
        }

        return {
            semester,
            count: ratings.length,
            average: Number(avg.toFixed(2)),
            median: Number(median.toFixed(2)),
            min: Math.min(...ratings),
            max: Math.max(...ratings),
            universityAverage: Number(avg.toFixed(2)), // Escala 1–5
            distribution: {
                excellent: ratings.filter((r) => r === 5).length,
                good: ratings.filter((r) => r === 4).length,
                regular: ratings.filter((r) => r === 3).length,
                poor: ratings.filter((r) => r === 2).length,
                deficient: ratings.filter((r) => r === 1).length,
                notApplicable: ratings.filter((r) => r === 0).length,
            },
        }
    }, [])

    // Actualización de comparación
    useEffect(() => {
        if (selectedSemesters.length < 2) {
            setComparisonData(null)
            return
        }

        const semesterData: any[] = []
        selectedSemesters.forEach((semester) => {
            const semesterFeedback = feedback.filter((item) => {
                const date = new Date(item.feedback_date)
                const year = date.getFullYear()
                const month = date.getMonth() + 1
                const itemSemester = month >= 7 ? `${year}-2` : `${year}-1`
                return itemSemester === semester
            })

            const metrics = calculateSemesterMetrics(semesterFeedback)
            if (metrics) semesterData.push({ ...metrics, semester })
        })

        setComparisonData(semesterData)
    }, [selectedSemesters, feedback, calculateSemesterMetrics])

    // Selección de semestres
    const handleSemesterToggle = (semester: string) => {
        setSelectedSemesters((prev) =>
            prev.includes(semester) ? prev.filter((s) => s !== semester) : prev.length < 4 ? [...prev, semester] : prev
        )
    }

    return (
        <div className="space-y-6">
            {/* Selector de semestres */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Selección de Semestres</CardTitle>
                    <CardDescription>Selecciona hasta 4 semestres para comparar</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableSemesters.map((semester) => (
                            <div
                                key={semester}
                                onClick={() => handleSemesterToggle(semester)}
                                className={cn(
                                    "p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                                    selectedSemesters.includes(semester)
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="text-center">
                                    <div className="font-semibold">Semestre {semester.replace("-", " - ")}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {
                                            feedback.filter((item) => {
                                                const date = new Date(item.feedback_date)
                                                const year = date.getFullYear()
                                                const month = date.getMonth() + 1
                                                const itemSemester = month >= 7 ? `${year}-2` : `${year}-1`
                                                return itemSemester === semester
                                            }).length
                                        }{" "}
                                        evaluaciones
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Contenido comparativo */}
            {comparisonData && comparisonData.length >= 2 ? (
                <div className="space-y-6">
                    {/* Resumen Ejecutivo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">📊 Resumen Comparativo</CardTitle>
                            <CardDescription>
                                Comparación de métricas clave entre {comparisonData.length} semestres seleccionados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {(() => {
                                            const totalEvaluations = comparisonData.reduce(
                                                (sum: number, data: any) => sum + data.count,
                                                0
                                            )
                                            return totalEvaluations
                                        })()}
                                    </div>
                                    <div className="text-sm text-blue-700">Total Evaluaciones</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {(() => {
                                            const avgRating =
                                                comparisonData.reduce((sum: number, data: any) => sum + data.average, 0) /
                                                comparisonData.length
                                            return avgRating.toFixed(1)
                                        })()}
                                    </div>
                                    <div className="text-sm text-green-700">Promedio General</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {(() => {
                                            const bestSemester = comparisonData.reduce((best: any, current: any) =>
                                                current.average > best.average ? current : best
                                            )
                                            return bestSemester.semester
                                        })()}
                                    </div>
                                    <div className="text-sm text-purple-700">Mejor Semestre</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gráfico de Comparación de Promedios */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">📈 Evolución de Promedios por Semestre</CardTitle>
                            <CardDescription>Comparación visual de los promedios de calificación entre semestres</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={comparisonData.map((data: any) => ({
                                            semestre: `Semestre ${data.semester.replace("-", " - ")}`,
                                            promedio: data.average,
                                            promedioUniversitario: data.universityAverage,
                                            evaluaciones: data.count,
                                        }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <XAxis dataKey="semestre" angle={-45} textAnchor="end" height={80} fontSize={12} />
                                        <YAxis domain={[0, 5]} />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                name === "promedio"
                                                    ? `${Number(value).toFixed(2)}/5`
                                                    : name === "promedioUniversitario"
                                                      ? `${Number(value).toFixed(2)}/5`
                                                      : value,
                                                name === "promedio"
                                                    ? "Promedio (1-5)"
                                                    : name === "promedioUniversitario"
                                                      ? "Promedio Universitario (1-5)"
                                                      : "Evaluaciones",
                                            ]}
                                        />
                                        <Legend />
                                        <Bar dataKey="promedio" fill="#3b82f6" name="Promedio (1-5)" />
                                        <Bar dataKey="promedioUniversitario" fill="#10b981" name="Promedio Universitario (1-5)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Distribución de Calificaciones por Semestre */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">🏆 Distribución de Calificaciones</CardTitle>
                            <CardDescription>Comparación de la distribución de calificaciones entre semestres</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={comparisonData.map((data: any) => ({
                                            semestre: `Semestre ${data.semester.replace("-", " - ")}`,
                                            excelente: data.distribution.excellent,
                                            bueno: data.distribution.good,
                                            regular: data.distribution.regular,
                                            poor: data.distribution.poor,
                                            deficiente: data.distribution.deficient,
                                            notApplicable: data.distribution.notApplicable,
                                        }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <XAxis dataKey="semestre" angle={-45} textAnchor="end" height={80} fontSize={12} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="excelente" stackId="a" fill="#22c55e" name="5 (Excelente)" />
                                        <Bar dataKey="bueno" stackId="a" fill="#3b82f6" name="4 (Muy Bueno)" />
                                        <Bar dataKey="regular" stackId="a" fill="#eab308" name="3 (Bueno)" />
                                        <Bar dataKey="poor" stackId="a" fill="#f97316" name="2 (Regular)" />
                                        <Bar dataKey="deficiente" stackId="a" fill="#ef4444" name="1 (Deficiente)" />
                                        <Bar dataKey="notApplicable" stackId="a" fill="#6b7280" name="0 (No aplica)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estadísticas Detalladas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">📋 Estadísticas Detalladas por Semestre</CardTitle>
                            <CardDescription>Métricas estadísticas completas para cada semestre seleccionado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {comparisonData.map((data: any) => (
                                    <Card key={data.semester} className="border-2 border-primary/10">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-primary">
                                                Semestre {data.semester.replace("-", " - ")}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Promedio:</span>
                                                        <span className="font-semibold">{data.average}/5</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Universitario:</span>
                                                        <span className="font-semibold">{data.universityAverage}/5</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Mediana:</span>
                                                        <span className="font-semibold">{data.median}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Mínimo:</span>
                                                        <span className="font-semibold">{data.min}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Máximo:</span>
                                                        <span className="font-semibold">{data.max}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <span className="font-semibold">{data.count}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Distribución de calificaciones */}
                                            <div className="space-y-2">
                                                <h5 className="font-medium text-sm">Distribución:</h5>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-green-600">5 (Excelente):</span>
                                                        <span className="font-medium">{data.distribution.excellent}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-blue-600">4 (Muy Bueno):</span>
                                                        <span className="font-medium">{data.distribution.good}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-yellow-600">3 (Bueno):</span>
                                                        <span className="font-medium">{data.distribution.regular}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-orange-600">2 (Regular):</span>
                                                        <span className="font-medium">{data.distribution.poor}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-red-600">1 (Deficiente):</span>
                                                        <span className="font-medium">{data.distribution.deficient}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-gray-600">0 (No aplica):</span>
                                                        <span className="font-medium">{data.distribution.notApplicable}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Análisis de Tendencias */}
                    {comparisonData.length > 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">📈 Análisis de Tendencias</CardTitle>
                                <CardDescription>
                                    Comparación del rendimiento entre el primer y último semestre seleccionado
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="font-medium text-blue-800">Tendencia General:</span>
                                            <span
                                                className={`font-bold ${
                                                    comparisonData[comparisonData.length - 1].average > comparisonData[0].average
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {comparisonData[comparisonData.length - 1].average > comparisonData[0].average
                                                    ? "↗"
                                                    : "↘"}
                                                {Math.abs(
                                                    comparisonData[comparisonData.length - 1].average - comparisonData[0].average
                                                ).toFixed(2)}{" "}
                                                puntos
                                            </span>
                                        </div>
                                        <p className="text-xs text-blue-700">
                                            Cambio entre {comparisonData[0].semester.replace("-", " - ")} y{" "}
                                            {comparisonData[comparisonData.length - 1].semester.replace("-", " - ")}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                        <div className="text-sm">
                                            <span className="font-medium text-green-800">Mejora en Consistencia:</span>
                                        </div>
                                        <div className="mt-2">
                                            {(() => {
                                                const firstSemester = comparisonData[0]
                                                const lastSemester = comparisonData[comparisonData.length - 1]
                                                const consistencyChange =
                                                    Math.abs(lastSemester.max - lastSemester.min) -
                                                    Math.abs(firstSemester.max - firstSemester.min)

                                                return (
                                                    <span
                                                        className={`font-bold ${consistencyChange < 0 ? "text-green-600" : "text-red-600"}`}
                                                    >
                                                        {consistencyChange < 0 ? "↗" : "↘"}
                                                        {Math.abs(consistencyChange).toFixed(2)} puntos de rango
                                                    </span>
                                                )
                                            })()}
                                        </div>
                                        <p className="text-xs text-green-700 mt-1">
                                            {Math.abs(
                                                comparisonData[comparisonData.length - 1].max -
                                                    comparisonData[comparisonData.length - 1].min
                                            ) < Math.abs(comparisonData[0].max - comparisonData[0].min)
                                                ? "Mejor consistencia"
                                                : "Mayor variabilidad"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-center w-full h-32">
                    <p className="text-sm text-muted-foreground">
                        Selecciona al menos 2 semestres para ver el análisis comparativo
                    </p>
                </div>
            )}
        </div>
    )
}
