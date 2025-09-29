"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import type { FeedbackState } from "@/lib/@types/types"
import type { Feedback, ProfessorService, SubjectService, AutoEvaluationAnswer } from "@/lib/@types/services"
import { cn, createPeriods, filterByPeriod, getAverageRatings, ratingFeedback } from "@/lib/utils"
import { getProfessors } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { getFeedback } from "@/services/feedback"
import { getAutoEvaluationAnswers } from "@/services/auto-evaluation"
import { getQuestionTitleById, getQuestionTitleByAnswerId } from "@/services/questions"
import { getQuestionsBySubject } from "@/services/questions"
import { getStudentEvaluationsBySubject } from "@/services/answer"
import { getAllCoevaluations } from "@/services/professors"
import { API_ENDPOINT } from "@/services/utils"
import type { AutoEvaluationBySemester } from "@/lib/@types/services"
import type { Question } from "@/lib/@types/services"

const timeframes = createPeriods(new Date("2024-01-01"))

const initialState = {
    timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
} as FeedbackState

// Helper function to separate questions by type
const getQuestionsByType = (questions: Question[]) => {
    const numericQuestions = questions.filter((q) => q.question_type === "numeric")
    const textQuestions = questions.filter((q) => q.question_type === "text")
    return { numericQuestions, textQuestions }
}

// Helper function to get student evaluation responses for specific questions
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
        console.log("🔍 [DEBUG] Processing questions:", {
            totalQuestions: questions.length,
            numericQuestions: numericQuestions.length,
            textQuestions: textQuestions.length,
            subjectId,
            evaluationsCount: filteredEvaluations.length,
        })

        // Group evaluations by question_id
        const evaluationsByQuestion = new Map<string, any[]>()
        filteredEvaluations.forEach((evaluationItem: any) => {
            if (!evaluationsByQuestion.has(evaluationItem.question_id)) {
                evaluationsByQuestion.set(evaluationItem.question_id, [])
            }
            evaluationsByQuestion.get(evaluationItem.question_id)!.push(evaluationItem)
        })

        console.log("🔍 [DEBUG] Evaluations grouped by question:", {
            uniqueQuestions: evaluationsByQuestion.size,
            evaluationsByQuestion: Object.fromEntries(evaluationsByQuestion),
        })

        // Process numeric questions
        numericQuestions.forEach((question) => {
            const questionEvaluations = evaluationsByQuestion.get(question.id) || []
            const numericValues = questionEvaluations
                .map((evaluationItem: any) => parseFloat(evaluationItem.response))
                .filter((val: number) => !isNaN(val))

            console.log("🔍 [DEBUG] Numeric question processing:", {
                questionId: question.id,
                questionTitle: question.title,
                evaluationsCount: questionEvaluations.length,
                numericValues,
            })

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

            console.log("🔍 [DEBUG] Text question processing:", {
                questionId: question.id,
                questionTitle: question.title,
                evaluationsCount: questionEvaluations.length,
                textValues,
            })

            if (textValues.length > 0) {
                textResponses.push({ question, responses: textValues })
            }
        })

        console.log("🔍 [DEBUG] Final results:", {
            numericResponses: numericResponses.length,
            textResponses: textResponses.length,
            hasData: numericResponses.length > 0 || textResponses.length > 0,
        })
    } catch (error) {
        console.error("❌ [DEBUG] Error fetching student evaluations:", error)
        // Return empty arrays - no sample data
        return { numericResponses: [], textResponses: [] }
    }

    // No additional fallback - return empty arrays if no data

    return { numericResponses, textResponses }
}

// Component for numeric question charts
const NumericQuestionChart = ({ question, responses }: { question: Question; responses: number[] }) => {
    if (responses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{question.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No hay respuestas numéricas disponibles</p>
                </CardContent>
            </Card>
        )
    }

    const avg = responses.reduce((a, b) => a + b, 0) / responses.length
    const min = Math.min(...responses)
    const max = Math.max(...responses)

    // Create distribution data
    const distribution = Array.from({ length: 10 }, (_, i) => {
        const rating = i + 1
        const count = responses.filter((r) => Math.floor(r) === rating).length
        return { rating, count, percentage: (count / responses.length) * 100 }
    }).filter((item) => item.count > 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{question.title}</CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Promedio: {avg.toFixed(1)}</span>
                    <span>
                        Rango: {min} - {max}
                    </span>
                    <span>Total: {responses.length}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {distribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>
                                    {rating} punto{rating !== 1 ? "s" : ""}
                                </span>
                                <span>
                                    {count} ({percentage.toFixed(1)}%)
                                </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// Component for text question responses
const TextQuestionDisplay = ({ question, responses }: { question: Question; responses: string[] }) => {
    if (responses.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{question.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No hay respuestas de texto disponibles</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{question.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                    {responses.length} respuesta{responses.length !== 1 ? "s" : ""}
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {responses.map((response, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg border-l-4 border-l-primary">
                            <p className="text-sm leading-relaxed">{response}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// PDF Generation Function
const generateFeedbackPDF = (
    professors: ProfessorService[],
    subjects: SubjectService[],
    options: FeedbackState,
    feedback: Feedback[],
    ratings: ReturnType<typeof ratingFeedback>,
    autoEvaluationAnswers: AutoEvaluationBySemester[],
    coevaluations: any[],
    studentEvaluations: {
        numericResponses: Array<{ question: Question; responses: number[] }>
        textResponses: Array<{ question: Question; responses: string[] }>
    },
    questions: Question[]
) => {
    const doc = new jsPDF()

    // Set up Spanish character support
    doc.setProperties({
        title: "Reporte de Retroalimentacion",
        subject: "Sistema de Evaluacion Docente",
        author: "Universidad El Bosque",
        keywords: "retroalimentacion, evaluacion, docente",
        creator: "Sistema de Evaluacion Docente UEB",
    })

    // Set font for better Spanish character support
    try {
        doc.setFont("helvetica")
    } catch (error) {
        console.warn("Helvetica font not available, using default")
    }

    const marginLeft = 20
    let y = 25

    // Get professor and subject names
    const professor = professors.find((p) => p.id === options.professorId)
    const subject = subjects.find((s) => s.id === options.subjectId)

    // PDF Header with better styling
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, 210, 35, "F")

    // Main title
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DE RETROALIMENTACIÓN", 105, 20, { align: "center" })

    // Subtitle
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Sistema de Evaluación Docente - Universidad El Bosque", 105, 28, { align: "center" })

    // Report Info with better spacing
    y = 45
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")

    const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    // Info section with background
    doc.setFillColor(245, 247, 250)
    doc.rect(marginLeft - 5, y - 5, 170, 35, "F")
    doc.setDrawColor(220, 220, 220)
    doc.rect(marginLeft - 5, y - 5, 170, 35)

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("INFORMACIÓN DEL REPORTE", marginLeft, y + 2)
    y += 10

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Docente: ${professor ? `${professor.first_name} ${professor.last_name}` : "No seleccionado"}`, marginLeft, y)
    y += 7
    doc.text(`Materia: ${subject ? subject.name : "No seleccionada"}`, marginLeft, y)
    y += 7
    doc.text(`Fecha del reporte: ${currentDate}`, marginLeft, y)
    y += 7
    doc.text(
        `Periodo de tiempo: ${options.timeframe ? new Date(options.timeframe.split(" - ")[0]).toLocaleDateString("es-ES") : "No seleccionado"}`,
        marginLeft,
        y
    )
    y += 15

    // Summary Section with better proportions
    const summaryBoxHeight = 50
    doc.setFillColor(240, 245, 255)
    doc.rect(marginLeft - 5, y - 3, 170, summaryBoxHeight, "F")
    doc.setDrawColor(30, 41, 59)
    doc.setLineWidth(0.8)
    doc.rect(marginLeft - 5, y - 3, 170, summaryBoxHeight)

    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "bold")
    doc.text("[+] RESUMEN EJECUTIVO", marginLeft, y + 3)
    y += 12

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")

    const filteredFeedback = filterByPeriod(feedback, options.timeframe)
    const avgRating = getAverageRatings(filteredFeedback)

    // Create better spaced visual indicators
    const indicatorSpacing = 10
    const indicatorY = y

    doc.setFillColor(255, 193, 7)
    doc.circle(marginLeft + 2, indicatorY - 1, 2.2, "F")
    doc.text(`* Calificacion promedio: ${avgRating.toFixed(1)}/5`, marginLeft + 8, indicatorY)
    y += indicatorSpacing

    doc.setFillColor(40, 167, 69)
    doc.circle(marginLeft + 2, indicatorY + 7, 2.2, "F")
    doc.text(`* Total de evaluaciones: ${filteredFeedback.length}`, marginLeft + 8, indicatorY + 8)
    y += indicatorSpacing

    doc.setFillColor(23, 162, 184)
    doc.circle(marginLeft + 2, indicatorY + 15, 2.2, "F")
    doc.text(`* Total de comentarios: ${feedback.length}`, marginLeft + 8, indicatorY + 16)
    y += 15

    // Comments Section with visual enhancement
    if (filteredFeedback.length > 0) {
        if (y > 200) {
            doc.addPage()
            y = 20
        }

        // Section header with background
        doc.setFillColor(255, 243, 224)
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(255, 193, 7)
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(139, 69, 19)
        doc.setFont("helvetica", "bold")
        doc.text("[+] COMENTARIOS DE ESTUDIANTES", marginLeft, y + 2)
        y += 15

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")

        filteredFeedback.forEach((item, index) => {
            if (y > 240) {
                doc.addPage()
                y = 20
            }

            // Comment box with better proportions
            const commentBoxHeight = 22
            doc.setFillColor(254, 249, 231)
            doc.rect(marginLeft, y - 3, 165, commentBoxHeight, "F")
            doc.setDrawColor(255, 193, 7)
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, commentBoxHeight)

            doc.setFontSize(8)
            doc.setFont("helvetica", "bold")
            doc.text(`${index + 1}. ${item.professor.first_name} ${item.professor.last_name}`, marginLeft + 3, y + 1)
            y += 6

            doc.setFontSize(7)
            doc.setFont("helvetica", "normal")
            doc.text(`   * Calificacion: ${item.rating}/10 | Fecha: ${item.feedback_date}`, marginLeft + 3, y + 1)
            y += 5

            const commentLines = doc.splitTextToSize(`   Comentario: ${item.feedback_text}`, 155)
            doc.text(commentLines, marginLeft + 3, y + 1)
            y += commentLines.length * 4 + 10
        })
    }

    // Student Evaluations Section with enhanced visuals
    if (studentEvaluations.numericResponses.length > 0 || studentEvaluations.textResponses.length > 0) {
        if (y > 180) {
            doc.addPage()
            y = 20
        }

        // Section header with background
        doc.setFillColor(232, 245, 233)
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(40, 167, 69)
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(21, 101, 42)
        doc.setFont("helvetica", "bold")
        doc.text("[+] EVALUACIONES DE ESTUDIANTES", marginLeft, y + 2)
        y += 15

        // Numeric Questions with visual enhancement
        studentEvaluations.numericResponses.forEach((item) => {
            if (y > 200) {
                doc.addPage()
                y = 20
            }

            // Question box with better proportions
            const questionBoxHeight = 14
            doc.setFillColor(240, 248, 255)
            doc.rect(marginLeft, y - 3, 165, questionBoxHeight, "F")
            doc.setDrawColor(30, 144, 255)
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, questionBoxHeight)

            doc.setFontSize(8)
            doc.setTextColor(30, 64, 175)
            doc.setFont("helvetica", "bold")
            doc.text(`[*] ${item.question.title}`, marginLeft + 3, y + 1)
            y += 10

            doc.setTextColor(0, 0, 0)
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")

            const avg = item.responses.reduce((a, b) => a + b, 0) / item.responses.length
            const min = Math.min(...item.responses)
            const max = Math.max(...item.responses)

            // Statistics with colored indicators
            doc.setFillColor(255, 193, 7)
            doc.circle(marginLeft + 2, y - 1, 1.5, "F")
            doc.text(`Promedio: ${avg.toFixed(1)} | Rango: ${min}-${max} | Total: ${item.responses.length}`, marginLeft + 7, y)
            y += 7

            // Distribution bars (visual representation)
            const distribution = Array.from({ length: 10 }, (_, i) => {
                const rating = i + 1
                const count = item.responses.filter((r) => Math.floor(r) === rating).length
                return { rating, count, percentage: (count / item.responses.length) * 100 }
            }).filter((item) => item.count > 0)

            distribution.forEach(({ rating, count, percentage }) => {
                if (y > 250) {
                    doc.addPage()
                    y = 20
                }

                // Visual bar
                const barWidth = (percentage / 100) * 80
                doc.setFillColor(30, 144, 255)
                doc.rect(marginLeft + 7, y - 2, barWidth, 3, "F")

                doc.text(`${rating}⭐ ${count} (${percentage.toFixed(1)}%)`, marginLeft + 90, y)
                y += 6
            })
            y += 8
        })

        // Text Questions with enhanced visuals
        studentEvaluations.textResponses.forEach((item) => {
            if (y > 180) {
                doc.addPage()
                y = 20
            }

            // Question header box with better proportions
            const textQuestionBoxHeight = 12
            doc.setFillColor(248, 240, 252)
            doc.rect(marginLeft, y - 3, 165, textQuestionBoxHeight, "F")
            doc.setDrawColor(139, 92, 246)
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, textQuestionBoxHeight)

            doc.setFontSize(8)
            doc.setTextColor(79, 70, 229)
            doc.setFont("helvetica", "bold")
            doc.text(`[+] ${item.question.title}`, marginLeft + 3, y + 1)
            y += 9

            doc.setTextColor(0, 0, 0)
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.text(`   Respuestas: ${item.responses.length}`, marginLeft + 3, y)
            y += 7

            item.responses.forEach((response, index) => {
                if (y > 230) {
                    doc.addPage()
                    y = 20
                }

                // Response box with better proportions
                const responseBoxHeight = 10
                doc.setFillColor(252, 251, 250)
                doc.rect(marginLeft + 3, y - 2, 160, responseBoxHeight, "F")
                doc.setDrawColor(209, 213, 219)
                doc.setLineWidth(0.2)
                doc.rect(marginLeft + 3, y - 2, 160, responseBoxHeight)

                doc.setFontSize(7)
                doc.setFont("helvetica", "normal")
                const responseLines = doc.splitTextToSize(`${index + 1}. ${response}`, 150)
                doc.text(responseLines, marginLeft + 6, y + 2)
                y += responseLines.length * 4 + 8
            })
            y += 8
        })
    }

    // Autoevaluation Section with enhanced visuals
    if (autoEvaluationAnswers.length > 0) {
        if (y > 160) {
            doc.addPage()
            y = 20
        }

        // Section header
        doc.setFillColor(225, 236, 255)
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(59, 130, 246)
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(29, 78, 216)
        doc.setFont("helvetica", "bold")
        doc.text("[+] AUTOEVALUACION DOCENTE", marginLeft, y + 2)
        y += 15

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")

        autoEvaluationAnswers.forEach((semesterData) => {
            if (y > 200) {
                doc.addPage()
                y = 20
            }

            if (semesterData && semesterData.semester) {
                // Semester box with better proportions
                const semesterBoxHeight = 8
                doc.setFillColor(239, 246, 255)
                doc.rect(marginLeft, y - 2, 165, semesterBoxHeight, "F")
                doc.setDrawColor(59, 130, 246)
                doc.setLineWidth(0.3)
                doc.rect(marginLeft, y - 2, 165, semesterBoxHeight)

                doc.setFontSize(8)
                doc.setFont("helvetica", "bold")
                doc.text(
                    `[+] Semestre ${semesterData.semester} (${semesterData.answers?.length || 0} respuestas)`,
                    marginLeft + 3,
                    y + 1
                )
                y += 10

                if (semesterData.answers && Array.isArray(semesterData.answers)) {
                    semesterData.answers.forEach((answer: any, answerIndex: number) => {
                        if (y > 240) {
                            doc.addPage()
                            y = 20
                        }

                        // Answer box with better proportions
                        const answerBoxHeight = 12
                        doc.setFillColor(250, 248, 242)
                        doc.rect(marginLeft + 3, y - 2, 160, answerBoxHeight, "F")
                        doc.setDrawColor(245, 158, 11)
                        doc.setLineWidth(0.2)
                        doc.rect(marginLeft + 3, y - 2, 160, answerBoxHeight)

                        doc.setFontSize(7)
                        doc.setFont("helvetica", "bold")
                        doc.text(`Pregunta: ${answer.question_title || `Pregunta ${answer.answer_id}`}`, marginLeft + 6, y + 1)
                        y += 6

                        doc.setFontSize(7)
                        doc.setFont("helvetica", "normal")
                        const answerLines = doc.splitTextToSize(`Respuesta: ${answer.answer_text || "Sin respuesta"}`, 150)
                        doc.text(answerLines, marginLeft + 6, y + 1)
                        y += answerLines.length * 4 + 8
                    })
                }
                y += 5
            }
        })
    }

    // Coevaluation Section with enhanced visuals
    if (coevaluations.length > 0) {
        if (y > 160) {
            doc.addPage()
            y = 20
        }

        // Section header
        doc.setFillColor(254, 242, 242)
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(239, 68, 68)
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(220, 38, 38)
        doc.setFont("helvetica", "bold")
        doc.text("[+] COEVALUACION INSTITUCIONAL", marginLeft, y + 2)
        y += 15

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")

        coevaluations.forEach((coevaluation, index) => {
            if (y > 180) {
                doc.addPage()
                y = 20
            }

            // Coevaluation header box with better proportions
            const coevaluationHeaderHeight = 8
            doc.setFillColor(254, 249, 249)
            doc.rect(marginLeft, y - 3, 165, coevaluationHeaderHeight, "F")
            doc.setDrawColor(239, 68, 68)
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, coevaluationHeaderHeight)

            doc.setFontSize(8)
            doc.setFont("helvetica", "bold")
            doc.text(
                `${index + 1}. Fecha: ${new Date(coevaluation.created_at).toLocaleDateString("es-ES")}`,
                marginLeft + 3,
                y + 1
            )
            y += 10

            // Info section
            doc.setFontSize(7)
            doc.setFont("helvetica", "normal")
            doc.text(
                `Profesor: ${coevaluation.professor ? `${coevaluation.professor.first_name} ${coevaluation.professor.last_name}` : "N/A"}`,
                marginLeft + 3,
                y
            )
            y += 5
            doc.text(`Materia: ${coevaluation.subject ? coevaluation.subject.name : "N/A"}`, marginLeft + 3, y)
            y += 5
            doc.text(
                `Admin: ${coevaluation.admin ? `${coevaluation.admin.first_name} ${coevaluation.admin.last_name}` : "N/A"}`,
                marginLeft + 3,
                y
            )
            y += 8

            // Findings section with better proportions
            const findingsBoxHeight = 8
            doc.setFillColor(254, 228, 226)
            doc.rect(marginLeft + 3, y - 2, 160, findingsBoxHeight, "F")
            doc.setDrawColor(239, 68, 68)
            doc.setLineWidth(0.2)
            doc.rect(marginLeft + 3, y - 2, 160, findingsBoxHeight)

            doc.setFontSize(7)
            doc.setFont("helvetica", "bold")
            doc.text("HALLAZGOS:", marginLeft + 6, y + 1)
            y += 8

            doc.setFontSize(7)
            doc.setFont("helvetica", "normal")
            const findingsLines = doc.splitTextToSize(coevaluation.findings, 150)
            doc.text(findingsLines, marginLeft + 6, y)
            y += findingsLines.length * 4 + 10

            // Improvement plan section with better proportions
            const planBoxHeight = 8
            doc.setFillColor(226, 232, 240)
            doc.rect(marginLeft + 3, y - 2, 160, planBoxHeight, "F")
            doc.setDrawColor(30, 58, 138)
            doc.setLineWidth(0.2)
            doc.rect(marginLeft + 3, y - 2, 160, planBoxHeight)

            doc.setFontSize(7)
            doc.setFont("helvetica", "bold")
            doc.text("PLAN DE MEJORAMIENTO:", marginLeft + 6, y + 1)
            y += 8

            doc.setFontSize(7)
            doc.setFont("helvetica", "normal")
            const planLines = doc.splitTextToSize(coevaluation.improvement_plan, 150)
            doc.text(planLines, marginLeft + 6, y)
            y += planLines.length * 4 + 12
        })
    }

    // Footer with enhanced styling
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer line
        doc.setDrawColor(180, 180, 180)
        doc.setLineWidth(0.5)
        doc.line(20, 280, 190, 280)

        // Page number
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(`Página ${i} de ${pageCount}`, 105, 288, { align: "center" })

        // Footer text
        doc.setFontSize(7)
        doc.text("Sistema de Evaluación Docente - Universidad El Bosque", 105, 295, { align: "center" })
    }

    // Save PDF with proper encoding
    const professorName = professor ? `${professor.first_name}_${professor.last_name}` : "profesor"
    const subjectName = subject ? subject.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") : "materia"
    const fileName = `Retroalimentacion_${professorName}_${subjectName}_${currentDate.replace(/\s+/g, "_")}.pdf`

    // Set PDF metadata for better character support
    try {
        doc.save(fileName)
    } catch (error) {
        console.error("Error saving PDF:", error)
        // Fallback filename
        doc.save("Reporte_Retroalimentacion.pdf")
    }
}

const FeedbackPage = () => {
    const [feedback, setFeedback] = useState<Feedback[]>([])
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [options, setOptions] = useState<FeedbackState>(initialState)
    const [ratings, setRatings] = useState<ReturnType<typeof ratingFeedback>>([])
    const [autoEvaluationAnswers, setAutoEvaluationAnswers] = useState<AutoEvaluationBySemester[]>([])
    const [questionTitles, setQuestionTitles] = useState<Record<string, string>>({})
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

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!options?.subjectId) return

            try {
                console.log("🔍 [FRONTEND] Fetching questions for subject:", options.subjectId)
                const questionsData = await getQuestionsBySubject(options.subjectId)
                console.log("🔍 [FRONTEND] Questions fetched:", questionsData)

                // If no questions found for this subject, try getting all questions as fallback
                if (!questionsData || questionsData.length === 0) {
                    console.log("⚠️ [FRONTEND] No questions found for subject, trying all questions")
                    const allQuestionsResponse = await fetch(`${API_ENDPOINT}/questions`)
                    const allQuestionsData = await allQuestionsResponse.json()
                    const allQuestions = Array.isArray(allQuestionsData.questions) ? allQuestionsData.questions : []
                    console.log("🔍 [FRONTEND] All questions fetched as fallback:", allQuestions)
                    setQuestions(allQuestions)
                } else {
                    setQuestions(questionsData)
                }
            } catch (error) {
                console.error("❌ [FRONTEND] Error fetching questions:", error)
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
                console.log("🔍 [FRONTEND] Fetching student evaluations for:", {
                    subjectId: options.subjectId,
                    timeframe: options.timeframe,
                    questionsCount: questions.length,
                })

                // Get all student evaluations for the subject
                const allEvaluations = await getStudentEvaluationsBySubject(options.subjectId, "")

                // Check if timeframe is in default/neutral state (show all results)
                const isDefaultTimeframe = options.timeframe === "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z"

                let filteredEvaluations = allEvaluations

                if (!isDefaultTimeframe && options.timeframe && options.timeframe.includes(" - ")) {
                    // Extract semester from timeframe for filtering
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

                console.log("📊 [FRONTEND] Filtered evaluations:", {
                    isDefaultTimeframe,
                    totalEvaluations: allEvaluations.length,
                    filteredCount: filteredEvaluations.length,
                    hasData: filteredEvaluations.length > 0,
                })

                const data = await getStudentEvaluationsByQuestionType(questions, options.subjectId, filteredEvaluations)

                console.log("📊 [FRONTEND] Student evaluations data:", data)
                setStudentEvaluations(data)
            } catch (error) {
                console.error("❌ [FRONTEND] Error fetching student evaluations:", error)
                setStudentEvaluations({ numericResponses: [], textResponses: [] })
            }
        }

        fetchStudentEvaluations()
    }, [questions, options?.subjectId, options?.timeframe])

    useEffect(() => {
        const fetchCoevaluations = async () => {
            try {
                console.log("🔍 [FRONTEND] Fetching coevaluations with filters:", {
                    professorId: options.professorId,
                    subjectId: options.subjectId,
                })
                const coevaluationData = await getAllCoevaluations(options.professorId, options.subjectId)
                console.log("📊 [FRONTEND] Filtered coevaluations data:", coevaluationData)
                setCoevaluations(coevaluationData)
            } catch (error) {
                console.error("❌ [FRONTEND] Error fetching coevaluations:", error)
                setCoevaluations([])
            }
        }

        fetchCoevaluations()
    }, [options?.professorId, options?.subjectId])

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Revisión de Retroalimentación</h2>
                    <p className="text-muted-foreground">Revisar la retroalimentación proporcionada por los estudiantes</p>
                </div>
                <Button
                    onClick={() =>
                        generateFeedbackPDF(
                            professors,
                            subjects,
                            options,
                            feedback,
                            ratings,
                            autoEvaluationAnswers,
                            coevaluations,
                            studentEvaluations,
                            questions
                        )
                    }
                    disabled={optionsDisabled}
                    className="flex items-center gap-2"
                >
                    <Download className="h-4 w-4" />
                    Generar PDF
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="selectedProfessor">Profesor</Label>
                    <Select value={options.professorId ?? ""} onValueChange={(value) => handleSelectChange("professorId", value)}>
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
            <Tabs className="w-full" defaultValue="summary">
                <TabsList className="grid w-full grid-cols-5">
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
                    {questions.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-32">
                            <p className="text-sm text-muted-foreground">No hay preguntas disponibles para esta materia</p>
                        </div>
                    ) : (
                        <>
                            {/* Student Evaluation Visualizations */}
                            {studentEvaluations.numericResponses.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-primary">📊 Preguntas Numéricas</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {studentEvaluations.numericResponses.map(({ question, responses }) => (
                                            <NumericQuestionChart key={question.id} question={question} responses={responses} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {studentEvaluations.textResponses.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-primary">📝 Preguntas de Texto</h3>
                                    <div className="grid gap-4 md:grid-cols-1">
                                        {studentEvaluations.textResponses.map(({ question, responses }) => (
                                            <TextQuestionDisplay key={question.id} question={question} responses={responses} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {studentEvaluations.numericResponses.length === 0 &&
                                studentEvaluations.textResponses.length === 0 && (
                                    <div className="flex items-center justify-center w-full h-32">
                                        <p className="text-sm text-muted-foreground">No hay datos de evaluacion estudiante</p>
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
                                                    {new Date(coevaluation.created_at).toLocaleDateString("es-ES")}
                                                </CardTitle>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    ID: {coevaluation.id.slice(0, 8)}...
                                                </span>
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
                                                            <span className="font-medium text-primary">📅 Fecha:</span>
                                                            <span>
                                                                {new Date(coevaluation.created_at).toLocaleString("es-ES")}
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
            </Tabs>
        </section>
    )
}

export default FeedbackPage
