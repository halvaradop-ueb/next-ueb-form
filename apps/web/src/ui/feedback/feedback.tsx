"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import jsPDF from "jspdf"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import type { FeedbackState } from "@/lib/@types/types"
import type { Feedback, ProfessorService, SubjectService, AutoEvaluationBySemester, Question } from "@/lib/@types/services"
import { cn, createPeriods, filterByPeriod, getAverageRatings, ratingFeedback } from "@/lib/utils"
import { getProfessors, getAllCoevaluations } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { getFeedback } from "@/services/feedback"
import { getAutoEvaluationAnswers } from "@/services/auto-evaluation"
import { getQuestionsBySubject } from "@/services/questions"
import { getStudentEvaluationsBySubject } from "@/services/answer"
import { API_ENDPOINT } from "@/services/utils"

const timeframes = createPeriods(new Date("2024-01-01"))

const initialState = {
    timeframe: "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z",
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

// Clean and simplified chart drawing function that matches the web page visuals
const drawChartsInPDF = (
    doc: jsPDF,
    marginLeft: number,
    y: number,
    studentEvaluations: {
        numericResponses: Array<{ question: Question; responses: number[] }>
        textResponses: Array<{ question: Question; responses: string[] }>
    }
): number => {
    let currentY = y

    if (studentEvaluations.numericResponses.length === 0) {
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos gráficos disponibles", marginLeft, currentY)
        return currentY + 20
    }

    // 1. Statistical Overview - matches the "Análisis Estadístico General" section
    currentY = drawStatisticalOverview(doc, marginLeft, currentY, studentEvaluations)
    currentY += 2 // Small spacing between charts

    // 2. Score Distribution - matches the pie chart data
    currentY = drawScoreDistribution(doc, marginLeft, currentY, studentEvaluations)
    currentY += 2 // Small spacing between charts

    // 3. Performance Trends - matches "Tendencias de Desempeño"
    currentY = drawPerformanceTrends(doc, marginLeft, currentY, studentEvaluations)
    currentY += 2 // Small spacing between charts

    // 4. Histogram - matches "Histograma de Calificaciones"
    currentY = drawHistogram(doc, marginLeft, currentY, studentEvaluations)
    currentY += 2 // Small spacing between charts

    // 5. Performance Categories - matches "Categorías de Desempeño"
    currentY = drawPerformanceCategories(doc, marginLeft, currentY, studentEvaluations)
    currentY += 2 // Small spacing between charts

    // 6. Trend Indicator - matches the "Tendencia General" section from the web page
    currentY = drawTrendIndicator(doc, marginLeft, currentY, studentEvaluations)

    return currentY
}

// Clean statistical overview that matches the web page
const drawStatisticalOverview = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 200) {
        doc.addPage()
        return 20
    }

    // Main container with proper margins
    const containerWidth = 170
    const containerHeight = 90
    doc.setFillColor(240, 248, 255)
    doc.rect(marginLeft, y, containerWidth, containerHeight, "F")
    doc.setDrawColor(30, 144, 255)
    doc.setLineWidth(0.5)
    doc.rect(marginLeft, y, containerWidth, containerHeight)

    // Title
    doc.setFontSize(10)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("ANÁLISIS ESTADÍSTICO GENERAL", marginLeft + 5, y + 8)
    const currentY = y + 15

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)

    if (allResponses.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Calculate statistics
    const avg = allResponses.reduce((a: number, b: number) => a + b, 0) / allResponses.length
    const min = Math.min(...allResponses)
    const max = Math.max(...allResponses)
    const median = [...allResponses].sort((a, b) => a - b)[Math.floor(allResponses.length / 2)]

    // Left side: Score distribution bars
    const pieX = marginLeft + 5
    const pieY = currentY

    const categories = [
        { name: "Excelente (9-10)", range: [9, 10], color: [34, 197, 94] },
        { name: "Bueno (7-8)", range: [7, 8], color: [59, 130, 246] },
        { name: "Regular (5-6)", range: [5, 6], color: [245, 158, 11] },
        { name: "Deficiente (0-4)", range: [0, 4], color: [239, 68, 68] },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => r >= category.range[0] && r <= category.range[1]).length
        if (count > 0) {
            const barY = pieY + index * 6
            const percentage = (count / allResponses.length) * 100
            const barWidth = Math.max((percentage / 100) * 45, 2) // Minimum width for visibility

            // Bar
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(pieX + 15, barY, barWidth, 5, "F")

            // Label
            doc.setFontSize(6)
            doc.setTextColor(51, 65, 85)
            doc.setFont("helvetica", "normal")
            doc.text(`${category.name}: ${count}`, pieX + 65, barY + 3)
        }
    })

    // Right side: Statistics boxes
    const summaryX = marginLeft + 85
    const stats = [
        { label: "Promedio General", value: avg.toFixed(1), color: [59, 130, 246] },
        { label: "Mediana", value: median.toFixed(1), color: [34, 197, 94] },
        { label: "Rango", value: `${min} - ${max}`, color: [245, 158, 11] },
        { label: "Total Evaluaciones", value: allResponses.length.toString(), color: [139, 92, 246] },
    ]

    stats.forEach((stat, index) => {
        const statY = currentY + index * 12

        // Background box
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
        doc.rect(summaryX, statY, 55, 10, "F")

        // Value (white text)
        doc.setFontSize(7)
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.text(stat.value, summaryX + 27, statY + 6)

        // Label (gray text below)
        doc.setFontSize(6)
        doc.setTextColor(51, 65, 85)
        doc.setFont("helvetica", "normal")
        doc.text(stat.label, summaryX, statY + 14)
    })

    return y + containerHeight + 5
}

// Clean score distribution chart
const drawScoreDistribution = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 200) {
        doc.addPage()
        return 20
    }

    // Container with proper spacing
    const containerWidth = 170
    const containerHeight = 70
    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, containerWidth, containerHeight, "F")
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, containerWidth, containerHeight)

    // Title
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.setFont("helvetica", "bold")
    doc.text("DISTRIBUCIÓN DE CALIFICACIONES", marginLeft + 5, y + 8)
    const currentY = y + 15

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const categories = [
        { name: "Excelente (9-10)", range: [9, 10], color: [34, 197, 94] },
        { name: "Bueno (7-8)", range: [7, 8], color: [59, 130, 246] },
        { name: "Regular (5-6)", range: [5, 6], color: [245, 158, 11] },
        { name: "Deficiente (0-4)", range: [0, 4], color: [239, 68, 68] },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => r >= category.range[0] && r <= category.range[1]).length
        if (count > 0) {
            const barY = currentY + index * 8
            const percentage = (count / allResponses.length) * 100
            const barWidth = Math.max((percentage / 100) * 100, 2)

            // Label
            doc.setFontSize(7)
            doc.setTextColor(51, 65, 85)
            doc.setFont("helvetica", "bold")
            doc.text(`${category.name}:`, marginLeft + 5, barY + 4)

            // Background bar
            doc.setFillColor(240, 240, 240)
            doc.rect(marginLeft + 55, barY, 100, 6, "F")

            // Value bar
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(marginLeft + 55, barY, barWidth, 6, "F")

            // Percentage
            doc.setFontSize(7)
            doc.setTextColor(51, 65, 85)
            doc.setFont("helvetica", "normal")
            doc.text(`${percentage.toFixed(1)}%`, marginLeft + 160, barY + 4)
        }
    })

    return y + containerHeight + 5
}

// Clean performance trends chart
const drawPerformanceTrends = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 200) {
        doc.addPage()
        return 20
    }

    // Container with proper height calculation
    const maxQuestions = Math.min(studentEvaluations.numericResponses.length, 5)
    const containerHeight = 15 + maxQuestions * 12 + 5

    doc.setFillColor(254, 240, 238)
    doc.rect(marginLeft, y, 170, containerHeight, "F")
    doc.setDrawColor(251, 146, 60)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, 170, containerHeight)

    doc.setFontSize(9)
    doc.setTextColor(194, 65, 12)
    doc.setFont("helvetica", "bold")
    doc.text("TENDENCIAS DE DESEMPEÑO", marginLeft + 5, y + 8)
    const currentY = y + 15

    if (studentEvaluations.numericResponses.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Draw bars for each question (max 5)
    for (let i = 0; i < maxQuestions; i++) {
        const item = studentEvaluations.numericResponses[i]
        const avgScore = item.responses.reduce((a: number, b: number) => a + b, 0) / item.responses.length
        const barY = currentY + i * 10
        const barWidth = Math.max((avgScore / 10) * 90, 2)
        const barHeight = 8

        // Background bar
        doc.setFillColor(254, 249, 231)
        doc.rect(marginLeft + 5, barY, 90, barHeight, "F")

        // Value bar
        doc.setFillColor(251, 146, 60)
        doc.rect(marginLeft + 5, barY, barWidth, barHeight, "F")

        // Question label (truncated)
        const questionTitle = item.question.title.length > 20 ? item.question.title.substring(0, 20) + "..." : item.question.title

        doc.setFontSize(6)
        doc.setTextColor(51, 65, 85)
        doc.setFont("helvetica", "normal")
        doc.text(`${questionTitle}: ${avgScore.toFixed(1)}`, marginLeft + 100, barY + 5)
    }

    return y + containerHeight + 5
}

// Clean histogram chart
const drawHistogram = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 200) {
        doc.addPage()
        return 20
    }

    // Container with proper dimensions
    const containerWidth = 170
    const chartHeight = 50
    const containerHeight = 15 + chartHeight + 15

    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, containerWidth, containerHeight, "F")
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, containerWidth, containerHeight)

    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.setFont("helvetica", "bold")
    doc.text("HISTOGRAMA DE CALIFICACIONES", marginLeft + 5, y + 8)
    const currentY = y + 15

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Create histogram data (0-10 scale)
    const histogramData = Array.from({ length: 11 }, (_, i) => {
        const score = i
        const count = allResponses.filter((response: number) => Math.floor(response) === score).length
        return { score, count }
    }).filter((item) => item.count > 0)

    if (histogramData.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos para mostrar histograma", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Draw histogram bars
    const maxCount = Math.max(...histogramData.map((d) => d.count))
    const barWidth = 6
    const availableWidth = 140
    const spacing = (availableWidth - histogramData.length * barWidth) / (histogramData.length - 1)

    histogramData.forEach((data, index) => {
        const barX = marginLeft + 15 + index * (barWidth + spacing)
        const barHeight = Math.max((data.count / maxCount) * chartHeight, 2)

        // Bar
        doc.setFillColor(107, 114, 128)
        doc.rect(barX, currentY + chartHeight - barHeight, barWidth, barHeight, "F")

        // Labels
        doc.setFontSize(6)
        doc.setTextColor(51, 65, 85)
        doc.setFont("helvetica", "normal")
        doc.text(`${data.score}`, barX + 2, currentY + chartHeight + 6)
        doc.text(`${data.count}`, barX + 2, currentY + chartHeight + 12)
    })

    return y + containerHeight + 5
}

// Clean performance categories chart
const drawPerformanceCategories = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 180) {
        doc.addPage()
        return 20
    }

    // Container with proper dimensions
    const containerWidth = 170
    const containerHeight = 65

    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, containerWidth, containerHeight, "F")
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, containerWidth, containerHeight)

    // Title
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.setFont("helvetica", "bold")
    doc.text("CATEGORÍAS DE DESEMPEÑO", marginLeft + 5, y + 8)
    const currentY = y + 15

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const categories = [
        { label: "Excelente", range: "9-10", color: [34, 197, 94], bgColor: [220, 252, 231], textColor: [21, 128, 61] },
        { label: "Bueno", range: "7-8", color: [59, 130, 246], bgColor: [219, 234, 254], textColor: [29, 78, 216] },
        { label: "Regular", range: "5-6", color: [245, 158, 11], bgColor: [254, 243, 199], textColor: [154, 52, 18] },
        { label: "Deficiente", range: "0-4", color: [239, 68, 68], bgColor: [254, 228, 226], textColor: [220, 38, 38] },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => {
            const num = Number(r)
            switch (category.range) {
                case "9-10":
                    return num >= 9 && num <= 10
                case "7-8":
                    return num >= 7 && num <= 8
                case "5-6":
                    return num >= 5 && num <= 6
                case "0-4":
                    return num >= 0 && num <= 4
                default:
                    return false
            }
        }).length

        if (count > 0) {
            const boxY = currentY + index * 10
            const percentage = (count / allResponses.length) * 100

            // Category box
            doc.setFillColor(category.bgColor[0], category.bgColor[1], category.bgColor[2])
            doc.rect(marginLeft + 5, boxY, 160, 9, "F")
            doc.setDrawColor(category.color[0], category.color[1], category.color[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft + 5, boxY, 160, 9)

            // Label and count
            doc.setFontSize(7)
            doc.setTextColor(category.textColor[0], category.textColor[1], category.textColor[2])
            doc.setFont("helvetica", "bold")
            doc.text(`${category.label} (${category.range})`, marginLeft + 10, boxY + 6)

            // Progress bar background
            doc.setFillColor(240, 240, 240)
            doc.rect(marginLeft + 75, boxY + 1, 55, 7, "F")

            // Progress bar value
            const progressBarWidth = Math.max((percentage / 100) * 55, 2)
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(marginLeft + 75, boxY + 1, progressBarWidth, 7, "F")

            // Percentage
            doc.setFontSize(6)
            doc.setTextColor(51, 65, 85)
            doc.setFont("helvetica", "normal")
            doc.text(`${percentage.toFixed(1)}%`, marginLeft + 135, boxY + 6)
        }
    })

    return y + containerHeight + 5
}

// Draw trend indicator that matches the "Tendencia General" section from the web page
const drawTrendIndicator = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 200) {
        doc.addPage()
        return 20
    }

    // Container with proper dimensions
    const containerWidth = 170
    const containerHeight = 20

    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, containerWidth, containerHeight, "F")
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, containerWidth, containerHeight)

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("No hay datos para calcular tendencia", marginLeft + 5, y + 12)
        return y + containerHeight
    }

    // Calculate if we have enough data for trend analysis (at least 2 questions)
    if (studentEvaluations.numericResponses.length < 2) {
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("Se necesitan al menos 2 preguntas para calcular tendencia", marginLeft + 5, y + 12)
        return y + containerHeight
    }

    // Calculate trend based on first vs last question performance
    const firstQuestion = studentEvaluations.numericResponses[0]
    const lastQuestion = studentEvaluations.numericResponses[studentEvaluations.numericResponses.length - 1]

    const firstAvg = firstQuestion.responses.reduce((a: number, b: number) => a + b, 0) / firstQuestion.responses.length
    const lastAvg = lastQuestion.responses.reduce((a: number, b: number) => a + b, 0) / lastQuestion.responses.length

    const isImproving = lastAvg > firstAvg
    const trendDifference = Math.abs(lastAvg - firstAvg)

    // Title
    doc.setFontSize(8)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("TENDENCIA GENERAL:", marginLeft + 5, y + 12)

    // Trend indicator (arrow and difference)
    const trendX = marginLeft + 130
    if (isImproving) {
        doc.setTextColor(34, 197, 94) // Green for improvement
        doc.setFont("helvetica", "bold")
        doc.text("↗", trendX, y + 8)
        doc.text(`+${trendDifference.toFixed(2)}`, trendX + 8, y + 8)
    } else {
        doc.setTextColor(239, 68, 68) // Red for decline
        doc.setFont("helvetica", "bold")
        doc.text("↘", trendX, y + 8)
        doc.text(`-${trendDifference.toFixed(2)}`, trendX + 8, y + 8)
    }

    // Subtitle
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    doc.text("puntos de diferencia", trendX + 25, y + 8)

    // Description
    doc.setFontSize(7)
    doc.setTextColor(51, 65, 85)
    doc.setFont("helvetica", "normal")
    doc.text(`Primera pregunta (${firstAvg.toFixed(1)}) vs Última pregunta (${lastAvg.toFixed(1)})`, marginLeft + 5, y + 16)

    return y + containerHeight + 5
}

// Clean chart generation function
const generateChartsInPDF = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    return drawChartsInPDF(doc, marginLeft, y, studentEvaluations)
}

// Simplified test function to verify basic chart drawing
const drawTestCharts = (doc: jsPDF, marginLeft: number, y: number): number => {
    let currentY = y

    // Test container
    doc.setFillColor(240, 248, 255)
    doc.rect(marginLeft - 2, currentY - 2, 166, 50, "F")
    doc.setDrawColor(30, 144, 255)
    doc.setLineWidth(0.5)
    doc.rect(marginLeft - 2, currentY - 2, 166, 50)

    // Test title
    doc.setFontSize(10)
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.text("GRAFICOS DE PRUEBA", marginLeft, currentY + 6)
    currentY += 15

    // Test bars
    const testData = [
        { label: "Categoria A", value: 75, color: [34, 197, 94] },
        { label: "Categoria B", value: 50, color: [59, 130, 246] },
        { label: "Categoria C", value: 25, color: [245, 158, 11] },
    ]

    testData.forEach((item, index) => {
        const barY = currentY + index * 8
        const barWidth = (item.value / 100) * 100

        // Label
        doc.setFontSize(8)
        doc.setTextColor(51, 65, 85)
        doc.setFont("helvetica", "normal")
        doc.text(`${item.label}:`, marginLeft + 5, barY + 4)

        // Bar
        doc.setFillColor(item.color[0], item.color[1], item.color[2])
        doc.rect(marginLeft + 50, barY, barWidth, 6, "F")

        // Value
        doc.text(`${item.value}%`, marginLeft + 155, barY + 4)
    })

    return currentY + 50
}

// PDF Generation Function
const generateFeedbackPDF = async (
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
    doc.rect(0, 0, 210, 40, "F")

    // Main title
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DE RETROALIMENTACIÓN", 105, 22, { align: "center" })

    // Subtitle
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Sistema de Evaluación Docente", 105, 30, { align: "center" })

    // University name
    doc.setFontSize(9)
    doc.text("Universidad El Bosque", 105, 36, { align: "center" })

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

    // Add a note about the charts section
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "italic")
    doc.text("→ Las gráficas detalladas se encuentran en la siguiente sección", marginLeft, y)
    y += 12

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

            // Comment header with professor info
            const headerHeight = 12
            doc.setFillColor(254, 243, 199)
            doc.rect(marginLeft, y - 3, 165, headerHeight, "F")
            doc.setDrawColor(245, 158, 11)
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, headerHeight)

            doc.setFontSize(8)
            doc.setTextColor(154, 52, 18)
            doc.setFont("helvetica", "bold")
            doc.text(`Profesor: ${item.professor.first_name} ${item.professor.last_name}`, marginLeft + 3, y + 1)
            y += 8

            // Rating and date info
            doc.setFontSize(7)
            doc.setTextColor(73, 41, 14)
            doc.setFont("helvetica", "normal")
            doc.text(
                `Calificacion: ${item.rating}/10 | Fecha: ${new Date(item.feedback_date).toLocaleDateString("es-ES")}`,
                marginLeft + 3,
                y
            )
            y += 8

            // Comment content box
            const commentLines = doc.splitTextToSize(item.feedback_text, 155)
            const commentBoxHeight = commentLines.length * 4 + 8

            doc.setFillColor(254, 249, 231)
            doc.rect(marginLeft, y - 2, 165, commentBoxHeight, "F")
            doc.setDrawColor(255, 193, 7)
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 2, 165, commentBoxHeight)

            doc.setFontSize(7)
            doc.setTextColor(101, 67, 33)
            doc.setFont("helvetica", "normal")
            doc.text("Comentario:", marginLeft + 3, y + 2)
            y += 6

            doc.text(commentLines, marginLeft + 3, y)
            y += commentLines.length * 4 + 12
        })
    }

    // Charts Section - use the same data and calculations as the feedback page
    const hasStudentEvaluations = studentEvaluations.numericResponses.length > 0
    const hasFeedbackData = feedback.length > 0

    if (hasStudentEvaluations || hasFeedbackData) {
        // Always start charts section on a new page if we're not at the beginning
        if (y > 50) {
            doc.addPage()
            y = 20
        }

        // Section header - matching the page style
        doc.setFillColor(59, 130, 246)
        doc.rect(marginLeft - 5, y - 3, 170, 12, "F")
        doc.setDrawColor(29, 78, 216)
        doc.setLineWidth(0.8)
        doc.rect(marginLeft - 5, y - 3, 170, 12)

        doc.setFontSize(12)
        doc.setTextColor(255, 255, 255)
        doc.setFont("helvetica", "bold")
        doc.text("GRAFICAS Y VISUALIZACIONES", marginLeft, y + 2)
        y += 10

        // Generate charts using the cleaned up functions
        if (hasStudentEvaluations) {
            y = generateChartsInPDF(doc, marginLeft, y, studentEvaluations)
        } else if (hasFeedbackData) {
            // For feedback-only data, show a simple message
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text("Gráficas basadas en comentarios de estudiantes", marginLeft, y)
            y += 20
        }
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

                doc.text(`${rating} ${count} (${percentage.toFixed(1)}%)`, marginLeft + 90, y)
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

        // Footer background
        doc.setFillColor(248, 250, 252)
        doc.rect(0, 275, 210, 25, "F")

        // Footer line
        doc.setDrawColor(59, 130, 246)
        doc.setLineWidth(1)
        doc.line(20, 275, 190, 275)

        // Page number with better styling
        doc.setFontSize(9)
        doc.setTextColor(29, 78, 216)
        doc.setFont("helvetica", "bold")
        doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: "center" })

        // Footer text with better styling
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.setFont("helvetica", "normal")
        doc.text("Sistema de Evaluación Docente - Universidad El Bosque", 105, 292, { align: "center" })
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

export const FeedbackManagement = () => {
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
                const allEvaluations = await getStudentEvaluationsBySubject(options.subjectId, "")
                const isDefaultTimeframe = options.timeframe === "2024-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z"

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
                console.error("❌ [FRONTEND] Error fetching student evaluations:", error)
                setStudentEvaluations({ numericResponses: [], textResponses: [] })
            }
        }

        fetchStudentEvaluations()
    }, [questions, options?.subjectId, options?.timeframe])

    useEffect(() => {
        const fetchCoevaluations = async () => {
            try {
                const coevaluationData = await getAllCoevaluations(options.professorId, options.subjectId)
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
                    onClick={async () => {
                        try {
                            // Show loading state
                            const button = document.querySelector("[data-pdf-button]") as HTMLButtonElement
                            if (button) {
                                button.innerHTML =
                                    '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Generando PDF...'
                                button.disabled = true
                            }

                            console.log("🚀 Iniciando generación de PDF con gráficas...")
                            console.log("📊 Datos disponibles:")
                            console.log("- studentEvaluations.numericResponses:", studentEvaluations.numericResponses.length)
                            console.log("- studentEvaluations.textResponses:", studentEvaluations.textResponses.length)
                            console.log("- feedback.length:", feedback.length)
                            console.log("- questions.length:", questions.length)

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
                                questions
                            )

                            console.log("✅ PDF generado exitosamente con gráficas")

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
                            console.error("❌ Error generando PDF:", error)

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
                                                            semesterFeedback.reduce((sum, item) => sum + item.rating, 0) /
                                                            semesterFeedback.length
                                                        // Convert from 1-10 scale to 1-5 university scale
                                                        const universityAvg = avg / 2
                                                        return {
                                                            semester,
                                                            average: avg,
                                                            universityAverage: universityAvg,
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
                                                const chartData = semesterAverages.map(
                                                    ({ semesterName, universityAverage, count }) => ({
                                                        semester: semesterName,
                                                        promedio: Number(universityAverage.toFixed(2)),
                                                        evaluaciones: count,
                                                        promedioOriginal: Number((universityAverage * 2).toFixed(1)),
                                                    })
                                                )

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
                                                                            (sum, item) => sum + item.universityAverage,
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
                                                            return allResponses.length > 0
                                                                ? (
                                                                      allResponses.reduce((a, b) => a + b, 0) /
                                                                      allResponses.length
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
                                                                                name: "Excelente (9-10)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter(
                                                                                            (r) => r >= 9 && r <= 10
                                                                                        ).length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "Bueno (7-8)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter(
                                                                                            (r) => r >= 7 && r <= 8
                                                                                        ).length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "Regular (5-6)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter(
                                                                                            (r) => r >= 5 && r <= 6
                                                                                        ).length,
                                                                                    0
                                                                                ),
                                                                            },
                                                                            {
                                                                                name: "Deficiente (0-4)",
                                                                                value: studentEvaluations.numericResponses.reduce(
                                                                                    (acc, item) =>
                                                                                        acc +
                                                                                        item.responses.filter(
                                                                                            (r) => r >= 0 && r <= 4
                                                                                        ).length,
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
                                                                        {["#22c55e", "#84cc16", "#eab308", "#ef4444"].map(
                                                                            (color, index) => (
                                                                                <Cell key={`cell-${index}`} fill={color} />
                                                                            )
                                                                        )}
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
                                                            if (allResponses.length === 0)
                                                                return (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        No hay datos disponibles
                                                                    </p>
                                                                )

                                                            const avg =
                                                                allResponses.reduce((a, b) => a + b, 0) / allResponses.length
                                                            const min = Math.min(...allResponses)
                                                            const max = Math.max(...allResponses)
                                                            const median = allResponses.sort((a, b) => a - b)[
                                                                Math.floor(allResponses.length / 2)
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
                                                                ({ question, responses }) => ({
                                                                    name:
                                                                        question.title.length > 15
                                                                            ? question.title.substring(0, 15) + "..."
                                                                            : question.title,
                                                                    promedio:
                                                                        responses.reduce((a, b) => a + b, 0) / responses.length,
                                                                    total: responses.length,
                                                                })
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
                                                            <YAxis domain={[0, 10]} />
                                                            <Tooltip
                                                                formatter={(value, name) => [
                                                                    name === "promedio"
                                                                        ? `${Number(value).toFixed(1)}/10`
                                                                        : value,
                                                                    name === "promedio" ? "Promedio" : "Total Respuestas",
                                                                ]}
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
                                                            data={Array.from({ length: 10 }, (_, i) => {
                                                                const rating = i + 1
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
                                                <div className="grid gap-4 md:grid-cols-4">
                                                    {[
                                                        {
                                                            label: "Excelente",
                                                            range: "9-10",
                                                            color: "bg-green-500",
                                                            bgColor: "bg-green-50",
                                                            textColor: "text-green-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) =>
                                                                    acc + item.responses.filter((r) => r >= 9 && r <= 10).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "Bueno",
                                                            range: "7-8",
                                                            color: "bg-blue-500",
                                                            bgColor: "bg-blue-50",
                                                            textColor: "text-blue-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) =>
                                                                    acc + item.responses.filter((r) => r >= 7 && r <= 8).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "Regular",
                                                            range: "5-6",
                                                            color: "bg-yellow-500",
                                                            bgColor: "bg-yellow-50",
                                                            textColor: "text-yellow-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) =>
                                                                    acc + item.responses.filter((r) => r >= 5 && r <= 6).length,
                                                                0
                                                            ),
                                                        },
                                                        {
                                                            label: "Deficiente",
                                                            range: "0-4",
                                                            color: "bg-red-500",
                                                            bgColor: "bg-red-50",
                                                            textColor: "text-red-700",
                                                            count: studentEvaluations.numericResponses.reduce(
                                                                (acc, item) =>
                                                                    acc + item.responses.filter((r) => r >= 0 && r <= 4).length,
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
                                                    {new Date(coevaluation.created_at).toLocaleDateString("es-ES")}
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
