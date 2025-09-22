"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FeedbackState } from "@/lib/@types/types"
import type { Feedback, ProfessorService, SubjectService, AutoEvaluationAnswer } from "@/lib/@types/services"
import { cn, createPeriods, filterByPeriod, getAverageRatings, ratingFeedback } from "@/lib/utils"
import { getProfessors } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { getFeedback } from "@/services/feedback"
import { getAutoEvaluationAnswers } from "@/services/auto-evaluation"
import { getQuestionTitleById, getQuestionTitleByAnswerId } from "@/services/questions"
import type { AutoEvaluationBySemester } from "@/lib/@types/services"

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
    const [autoEvaluationAnswers, setAutoEvaluationAnswers] = useState<AutoEvaluationBySemester[]>([])
    const [questionTitles, setQuestionTitles] = useState<Record<string, string>>({})

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
                console.log("🔍 [Frontend] Raw autoEvaluationData:", autoEvaluationData)
                console.log("🔍 [Frontend] Data type:", typeof autoEvaluationData)
                console.log("🔍 [Frontend] Is array:", Array.isArray(autoEvaluationData))
                if (Array.isArray(autoEvaluationData) && autoEvaluationData.length > 0) {
                    console.log("🔍 [Frontend] First item:", autoEvaluationData[0])
                    console.log("🔍 [Frontend] First item keys:", Object.keys(autoEvaluationData[0]))
                    if (autoEvaluationData[0].answers && autoEvaluationData[0].answers.length > 0) {
                        console.log("🔍 [Frontend] First answer object:", autoEvaluationData[0].answers[0])
                        console.log("🔍 [Frontend] First answer keys:", Object.keys(autoEvaluationData[0].answers[0]))
                        console.log("🔍 [Frontend] First answer question_title:", autoEvaluationData[0].answers[0].question_title)
                        console.log("🔍 [Frontend] First answer answer_id:", autoEvaluationData[0].answers[0].answer_id)
                    }
                }
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
                    <Select value={options.professorId ?? ""} onValueChange={(value) => handleSelectChange("professorId", value)}>
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
                        value={options.subjectId ?? ""}
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
                    {autoEvaluationAnswers.length === 0 && (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay respuestas de autoevaluación disponibles</p>
                        </div>
                    )}

                    {/* Check if data is already grouped by semester (from API) */}
                    {autoEvaluationAnswers.length > 0 && autoEvaluationAnswers[0]?.answers
                        ? // Data is already grouped by semester
                          autoEvaluationAnswers.map((semesterData, index) =>
                              semesterData && semesterData.semester ? (
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
                                                                          {(() => {
                                                                              const answerId = answer.answer_id
                                                                              const questionId = answer.question_id

                                                                              // Check if we already have the title cached
                                                                              if (questionTitles[answerId]) {
                                                                                  return questionTitles[answerId]
                                                                              }

                                                                              // If we have a question_title from the API, use it
                                                                              if (
                                                                                  answer.question_title &&
                                                                                  answer.question_title !== `Pregunta ${answerId}`
                                                                              ) {
                                                                                  console.log(
                                                                                      "✅ [Frontend] Using question_title from API:",
                                                                                      answer.question_title
                                                                                  )
                                                                                  return answer.question_title
                                                                              }

                                                                              // Debug: Log the actual data structure
                                                                              console.log("🔍 [DEBUG] Answer object:", answer)
                                                                              console.log(
                                                                                  "🔍 [DEBUG] Answer keys:",
                                                                                  Object.keys(answer)
                                                                              )
                                                                              console.log(
                                                                                  "🔍 [DEBUG] question_id value:",
                                                                                  questionId
                                                                              )
                                                                              console.log("🔍 [DEBUG] answer_id value:", answerId)
                                                                              console.log(
                                                                                  "🔍 [DEBUG] question_title value:",
                                                                                  answer.question_title
                                                                              )

                                                                              // Try to fetch the title asynchronously and update state
                                                                              if (questionId && questionId !== answerId) {
                                                                                  getQuestionTitleById(questionId)
                                                                                      .then((title) => {
                                                                                          if (title) {
                                                                                              console.log(
                                                                                                  "✅ [Frontend] Successfully fetched question title:",
                                                                                                  title
                                                                                              )
                                                                                              setQuestionTitles((prev) => ({
                                                                                                  ...prev,
                                                                                                  [answerId]: title,
                                                                                              }))
                                                                                          }
                                                                                      })
                                                                                      .catch((error) => {
                                                                                          console.error(
                                                                                              "❌ [Frontend] Error fetching question title:",
                                                                                              error
                                                                                          )
                                                                                      })
                                                                                  return `Loading... (${questionId})`
                                                                              }

                                                                              // Fallback: try with answer_id
                                                                              if (answerId) {
                                                                                  console.log(
                                                                                      "🔍 [Frontend] Using answer_id as fallback:",
                                                                                      answerId
                                                                                  )
                                                                                  // Since the backend already provides question_id, use that instead
                                                                                  if (questionId && questionId !== answerId) {
                                                                                      getQuestionTitleById(questionId)
                                                                                          .then((title) => {
                                                                                              if (title) {
                                                                                                  console.log(
                                                                                                      "✅ [Frontend] Successfully fetched question title:",
                                                                                                      title
                                                                                                  )
                                                                                                  setQuestionTitles((prev) => ({
                                                                                                      ...prev,
                                                                                                      [answerId]: title,
                                                                                                  }))
                                                                                              }
                                                                                          })
                                                                                          .catch((error) => {
                                                                                              console.error(
                                                                                                  "❌ [Frontend] Error fetching question title:",
                                                                                                  error
                                                                                              )
                                                                                          })
                                                                                      return `Loading... (${questionId})`
                                                                                  } else {
                                                                                      return `Answer ID: ${answerId}`
                                                                                  }
                                                                              }

                                                                              // Final fallback
                                                                              return (
                                                                                  answer.question_title || `Pregunta ${answerId}`
                                                                              )
                                                                          })()}
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
                          )
                        : // Data is individual answers, need to group by semester
                          (() => {
                              const groupedBySemester = autoEvaluationAnswers.reduce(
                                  (acc, item) => {
                                      if (!acc[item.semester]) acc[item.semester] = []
                                      acc[item.semester].push(item)
                                      return acc
                                  },
                                  {} as Record<string, typeof autoEvaluationAnswers>
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
                                              {(answers as unknown as AutoEvaluationAnswer[]).map(
                                                  (answer: AutoEvaluationAnswer, answerIndex: number) => (
                                                      <div
                                                          key={answer.id || answerIndex}
                                                          className="border-l-4 border-l-primary/30 pl-4 py-3 bg-muted/30 rounded-r-lg"
                                                      >
                                                          <div className="space-y-3">
                                                              <div className="flex items-center justify-between">
                                                                  <div>
                                                                      <h4 className="font-semibold text-primary">
                                                                          {(() => {
                                                                              const answerId = answer.answer_id
                                                                              const questionId = answer.question_id

                                                                              // Check if we already have the title cached
                                                                              if (questionTitles[answerId]) {
                                                                                  return questionTitles[answerId]
                                                                              }

                                                                              // If we have a question_title from the API, use it
                                                                              if (
                                                                                  answer.question_title &&
                                                                                  answer.question_title !== `Pregunta ${answerId}`
                                                                              ) {
                                                                                  console.log(
                                                                                      "✅ [Frontend 2] Using question_title from API:",
                                                                                      answer.question_title
                                                                                  )
                                                                                  return answer.question_title
                                                                              }

                                                                              // Debug: Log the actual data structure
                                                                              console.log("🔍 [DEBUG 2] Answer object:", answer)
                                                                              console.log(
                                                                                  "🔍 [DEBUG 2] Answer keys:",
                                                                                  Object.keys(answer)
                                                                              )
                                                                              console.log(
                                                                                  "🔍 [DEBUG 2] question_id value:",
                                                                                  questionId
                                                                              )
                                                                              console.log(
                                                                                  "🔍 [DEBUG 2] answer_id value:",
                                                                                  answerId
                                                                              )
                                                                              console.log(
                                                                                  "🔍 [DEBUG 2] question_title value:",
                                                                                  answer.question_title
                                                                              )

                                                                              // Try to fetch the title asynchronously and update state
                                                                              if (questionId && questionId !== answerId) {
                                                                                  getQuestionTitleById(questionId)
                                                                                      .then((title) => {
                                                                                          if (title) {
                                                                                              console.log(
                                                                                                  "✅ [Frontend 2] Successfully fetched question title:",
                                                                                                  title
                                                                                              )
                                                                                              setQuestionTitles((prev) => ({
                                                                                                  ...prev,
                                                                                                  [answerId]: title,
                                                                                              }))
                                                                                          }
                                                                                      })
                                                                                      .catch((error) => {
                                                                                          console.error(
                                                                                              "❌ [Frontend 2] Error fetching question title:",
                                                                                              error
                                                                                          )
                                                                                      })
                                                                                  return `Loading... (${questionId})`
                                                                              }

                                                                              // Fallback: try with answer_id
                                                                              if (answerId) {
                                                                                  console.log(
                                                                                      "🔍 [Frontend 2] Using answer_id as fallback:",
                                                                                      answerId
                                                                                  )
                                                                                  // Since the backend already provides question_id, use that instead
                                                                                  if (questionId && questionId !== answerId) {
                                                                                      getQuestionTitleById(questionId)
                                                                                          .then((title) => {
                                                                                              if (title) {
                                                                                                  console.log(
                                                                                                      "✅ [Frontend 2] Successfully fetched question title:",
                                                                                                      title
                                                                                                  )
                                                                                                  setQuestionTitles((prev) => ({
                                                                                                      ...prev,
                                                                                                      [answerId]: title,
                                                                                                  }))
                                                                                              }
                                                                                          })
                                                                                          .catch((error) => {
                                                                                              console.error(
                                                                                                  "❌ [Frontend 2] Error fetching question title:",
                                                                                                  error
                                                                                              )
                                                                                          })
                                                                                      return `Loading... (${questionId})`
                                                                                  } else {
                                                                                      return `Answer ID: ${answerId}`
                                                                                  }
                                                                              }

                                                                              // Final fallback
                                                                              return (
                                                                                  answer.question_title || `Pregunta ${answerId}`
                                                                              )
                                                                          })()}
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
                                                  )
                                              )}
                                          </div>
                                      </CardContent>
                                  </Card>
                              ))
                          })()}
                </TabsContent>
            </Tabs>
        </section>
    )
}

export default FeedbackPage
