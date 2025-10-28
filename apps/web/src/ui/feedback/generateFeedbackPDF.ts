import jsPDF from "jspdf"
import type { Feedback, ProfessorService, SubjectService, AutoEvaluationBySemester, Question } from "@/lib/@types/services"
import type { FeedbackState } from "@/lib/@types/types"
import { filterByPeriod, getAverageRatings, formatSemester } from "@/lib/utils"

export const PDF_CONSTANTS = {
    MARGIN: 42, // Increased to 1.5cm (42pt)
    LINE_SPACING: 10,
    SECTION_SPACING: 18,
    HEADER_HEIGHT: 14,
    DATA_BAR_HEIGHT: 10,
    CONTAINER_HEIGHT: 25,
    FOOTER_HEIGHT: 18,
    COLORS: {
        primary: [59, 130, 246], // Blue
        primaryLight: [219, 234, 254], // Light blue
        secondary: [34, 197, 94], // Green
        secondaryLight: [220, 252, 231], // Light green
        accent: [245, 158, 11], // Orange
        accentLight: [254, 243, 199], // Light orange
        neutral: [156, 163, 175], // Gray
        neutralLight: [243, 244, 246], // Light gray
        background: [250, 250, 250],
        text: [30, 41, 59],
        textLight: [100, 100, 100],
        border: [220, 220, 220],
        white: [255, 255, 255],
        gray: [107, 114, 128],
        grayLight: [240, 240, 240],
    },
    TYPOGRAPHY: {
        mainTitle: { size: 16, font: "bold" },
        sectionTitle: { size: 14, font: "bold" }, // Increased from 11pt
        regular: { size: 11, font: "normal" }, // Increased from 9pt
        small: { size: 10, font: "normal" }, // Increased from 7pt, minimum 10pt for charts
    },
}

// Helper function to get dynamic content width
export const getContentWidth = (doc: jsPDF): number => {
    return doc.internal.pageSize.getWidth() - PDF_CONSTANTS.MARGIN * 2
}

// Helper function to check and handle page breaks
export const checkPageBreak = (doc: jsPDF, y: number, minHeight: number = 50): number => {
    if (y > 260 - minHeight) {
        doc.addPage()
        return 20
    }
    return y
}

const drawSectionHeader = (doc: jsPDF, title: string, y: number, marginLeft: number): number => {
    const contentWidth = getContentWidth(doc)

    doc.setFillColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.rect(marginLeft, y, contentWidth, PDF_CONSTANTS.HEADER_HEIGHT, "F")
    doc.setTextColor(PDF_CONSTANTS.COLORS.white[0], PDF_CONSTANTS.COLORS.white[1], PDF_CONSTANTS.COLORS.white[2])
    doc.setFontSize(PDF_CONSTANTS.TYPOGRAPHY.sectionTitle.size)
    doc.setFont("helvetica", PDF_CONSTANTS.TYPOGRAPHY.sectionTitle.font)
    doc.text(title, marginLeft + 4, y + 7)
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

    return y + PDF_CONSTANTS.HEADER_HEIGHT + PDF_CONSTANTS.LINE_SPACING
}

const setTypography = (doc: jsPDF, type: keyof typeof PDF_CONSTANTS.TYPOGRAPHY) => {
    const config = PDF_CONSTANTS.TYPOGRAPHY[type]
    doc.setFontSize(config.size)
    doc.setFont("helvetica", config.font)
}

// Clean and simplified chart drawing function that matches the web page visuals
const drawChartsInPDF = (
    doc: jsPDF,
    marginLeft: number,
    y: number,
    studentEvaluations: {
        numericResponses: Array<{ question: Question; responses: number[] }>
        textResponses: Array<{ question: Question; responses: string[] }>
    },
    semesterAverages?: Array<{
        semester: string
        average: number
        universityAverage: number
        count: number
        semesterName: string
    }>
): number => {
    let currentY = y

    try {
        // 1. Statistical Overview - matches the "Análisis Estadístico General" section
        currentY = drawStatisticalOverview(doc, marginLeft, currentY, studentEvaluations)

        // 2. Score Distribution - matches the pie chart data
        currentY = drawScoreDistribution(doc, marginLeft, currentY, studentEvaluations)

        // 3. Performance Trends - matches "Tendencias de Desempeño"
        currentY = drawPerformanceTrends(doc, marginLeft, currentY, studentEvaluations)

        // 4. Histogram - matches "Histograma de Calificaciones"
        currentY = drawHistogram(doc, marginLeft, currentY, studentEvaluations)

        // 5. Performance Categories - matches "Categorías de Desempeño"
        currentY = drawPerformanceCategories(doc, marginLeft, currentY, studentEvaluations)

        // 6. Trend Indicator - matches the "Tendencia General" section from the web page
        currentY = drawTrendIndicator(doc, marginLeft, currentY, studentEvaluations)

        // 7. Grade Timeline - shows teacher performance evolution over semesters
        const timelineY = drawGradeTimeline(doc, marginLeft, currentY, semesterAverages || [])
        currentY = timelineY

        return currentY
    } catch {
        currentY = drawTestCharts(doc, marginLeft, currentY)
        return currentY
    }
}

// Clean statistical overview that matches the web page
const drawStatisticalOverview = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    y = checkPageBreak(doc, y, 120)
    const contentWidth = getContentWidth(doc)

    // Calculate dynamic height based on data - scale with number of categories
    const allResponses = studentEvaluations.numericResponses?.flatMap((item: any) => item.responses) || []
    const activeCategories = [5, 4, 3, 2, 1, 0].filter(
        (score) => allResponses.filter((r: number) => Math.floor(r) === score).length > 0
    ).length
    const containerHeight = Math.max(80 + activeCategories * 15, 120) // Minimum 120pt, scale with data

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.5)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "ANÁLISIS ESTADÍSTICO GENERAL", y, marginLeft)
    const currentY = y

    // Use real data if available, otherwise show message
    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Filter out "No aplica" (0) ratings for accurate statistics
    const validResponses = allResponses.filter((r: number) => r > 0)
    const dataToUse = validResponses.length > 0 ? validResponses : allResponses

    // Calculate statistics using only valid responses
    const avg = dataToUse.reduce((a: number, b: number) => a + b, 0) / dataToUse.length
    const min = Math.min(...dataToUse)
    const max = Math.max(...dataToUse)
    const median = [...dataToUse].sort((a, b) => a - b)[Math.floor(dataToUse.length / 2)]

    // Left side: Score distribution bars - improved layout with better proportions
    const leftSectionWidth = contentWidth * 0.45
    const barX = marginLeft + 5
    const barY = currentY

    const categories = [
        { name: "5 (Excelente)", range: [5, 5], color: PDF_CONSTANTS.COLORS.primary },
        { name: "4 (Muy Bueno)", range: [4, 4], color: PDF_CONSTANTS.COLORS.secondary },
        { name: "3 (Bueno)", range: [3, 3], color: PDF_CONSTANTS.COLORS.accent },
        { name: "2 (Regular)", range: [2, 2], color: PDF_CONSTANTS.COLORS.neutral },
        { name: "1 (Deficiente)", range: [1, 1], color: PDF_CONSTANTS.COLORS.neutralLight },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => r >= category.range[0] && r <= category.range[1]).length
        if (count > 0) {
            const currentBarY = barY + index * (PDF_CONSTANTS.LINE_SPACING + 12) // Reduced spacing since no bars

            // Category label on first line
            setTypography(doc, "regular")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            doc.text(category.name, barX, currentBarY + 6)

            // Count on second line, aligned with the label
            doc.text(`Cantidad: ${count}`, barX, currentBarY + 14)
        }
    })

    // Right side: Statistics boxes - improved layout and alignment
    const rightSectionX = marginLeft + contentWidth * 0.52
    const boxWidth = contentWidth * 0.43
    const boxHeight = 16
    const stats = [
        { label: "Promedio General", value: avg.toFixed(1), color: PDF_CONSTANTS.COLORS.primary },
        { label: "Mediana", value: median.toFixed(1), color: PDF_CONSTANTS.COLORS.secondary },
        { label: "Rango", value: `${min} - ${max}`, color: PDF_CONSTANTS.COLORS.accent },
        { label: "Total Evaluaciones", value: allResponses.length.toString(), color: PDF_CONSTANTS.COLORS.neutral },
    ]

    stats.forEach((stat, index) => {
        const statY = currentY + index * (boxHeight + 5)

        // Background box - better proportions
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
        doc.rect(rightSectionX, statY, boxWidth, boxHeight, "F")

        // Value (white text) - positioned in upper half
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.white[0], PDF_CONSTANTS.COLORS.white[1], PDF_CONSTANTS.COLORS.white[2])
        doc.text(stat.value, rightSectionX + boxWidth / 2, statY + 7, { align: "center" })

        // Label (darker text below the box)
        setTypography(doc, "small")
        doc.setTextColor(60, 60, 60)
        doc.text(stat.label, rightSectionX + boxWidth / 2, statY + boxHeight + 4, { align: "center" })
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean score distribution chart
const drawScoreDistribution = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    y = checkPageBreak(doc, y, 100)
    const contentWidth = getContentWidth(doc)

    // Calculate dynamic height based on active categories
    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    const activeCategories = [5, 4, 3, 2, 1, 0].filter(
        (score) => allResponses.filter((r: number) => Math.floor(r) === score).length > 0
    ).length
    const containerHeight = Math.max(60 + activeCategories * 18, 100) // Scale with data, minimum 100pt

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "DISTRIBUCIÓN DE CALIFICACIONES", y, marginLeft)
    const currentY = y

    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const categories = [
        { name: "5 (Excelente)", range: [5, 5], color: PDF_CONSTANTS.COLORS.primary },
        { name: "4 (Muy Bueno)", range: [4, 4], color: PDF_CONSTANTS.COLORS.secondary },
        { name: "3 (Bueno)", range: [3, 3], color: PDF_CONSTANTS.COLORS.accent },
        { name: "2 (Regular)", range: [2, 2], color: PDF_CONSTANTS.COLORS.neutral },
        { name: "1 (Deficiente)", range: [1, 1], color: PDF_CONSTANTS.COLORS.neutralLight },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => r >= category.range[0] && r <= category.range[1]).length
        if (count > 0) {
            const barY = currentY + index * (PDF_CONSTANTS.LINE_SPACING + 10)
            const percentage = (count / allResponses.length) * 100
            const barWidth = Math.max((percentage / 100) * (contentWidth * 0.65), 10)

            // Label with better font size
            setTypography(doc, "regular")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            doc.text(`${category.name}:`, marginLeft + 5, barY + 6)

            // Background bar with better proportions
            doc.setFillColor(240, 240, 240)
            doc.rect(marginLeft + contentWidth * 0.35, barY, contentWidth * 0.65, PDF_CONSTANTS.DATA_BAR_HEIGHT + 4, "F")

            // Value bar with better height
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(marginLeft + contentWidth * 0.35, barY, barWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT + 4, "F")

            // Percentage with better alignment
            setTypography(doc, "regular")
            doc.text(`${percentage.toFixed(1)}%`, marginLeft + contentWidth * 0.98, barY + 6, { align: "right" })
        }
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean performance trends chart
const drawPerformanceTrends = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    const contentWidth = getContentWidth(doc)
    const numQuestions = studentEvaluations.numericResponses.length

    if (numQuestions === 0) {
        y = checkPageBreak(doc, y, 80)
        const containerHeight = 80

        doc.setFillColor(
            PDF_CONSTANTS.COLORS.primaryLight[0],
            PDF_CONSTANTS.COLORS.primaryLight[1],
            PDF_CONSTANTS.COLORS.primaryLight[2]
        )
        doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.setLineWidth(0.3)
        doc.rect(marginLeft, y, contentWidth, containerHeight)

        y = drawSectionHeader(doc, "TENDENCIAS DE DESEMPEÑO", y, marginLeft)
        const currentY = y

        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Calculate dynamic height and handle page breaks for each question
    let currentY = y
    let questionIndex = 0

    while (questionIndex < numQuestions) {
        // Check if we need a page break before starting this section
        currentY = checkPageBreak(doc, currentY, 100)

        // Calculate how many questions can fit on this page
        const availableHeight = 250 - currentY // Leave some margin at bottom
        const questionsPerPage = Math.max(1, Math.floor(availableHeight / 25)) // Each question needs ~25pt
        const questionsThisPage = Math.min(questionsPerPage, numQuestions - questionIndex)

        // Container height for this page's questions
        const containerHeight = 20 + questionsThisPage * 25 + 10

        doc.setFillColor(
            PDF_CONSTANTS.COLORS.primaryLight[0],
            PDF_CONSTANTS.COLORS.primaryLight[1],
            PDF_CONSTANTS.COLORS.primaryLight[2]
        )
        doc.rect(marginLeft, currentY, contentWidth, containerHeight, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.setLineWidth(0.3)
        doc.rect(marginLeft, currentY, contentWidth, containerHeight)

        // Title only on first page
        if (questionIndex === 0) {
            currentY = drawSectionHeader(doc, "TENDENCIAS DE DESEMPEÑO", currentY, marginLeft)
        } else {
            // Continuation header for subsequent pages
            doc.setFillColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.rect(marginLeft, currentY, contentWidth, PDF_CONSTANTS.HEADER_HEIGHT, "F")
            doc.setTextColor(PDF_CONSTANTS.COLORS.white[0], PDF_CONSTANTS.COLORS.white[1], PDF_CONSTANTS.COLORS.white[2])
            setTypography(doc, "sectionTitle")
            doc.setFont("helvetica", PDF_CONSTANTS.TYPOGRAPHY.sectionTitle.font)
            doc.text("TENDENCIAS DE DESEMPEÑO (CONTINUACIÓN)", marginLeft + 4, currentY + 7)
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            currentY += PDF_CONSTANTS.HEADER_HEIGHT + PDF_CONSTANTS.LINE_SPACING
        }

        const pageStartY = currentY

        // Draw questions for this page
        for (let i = 0; i < questionsThisPage && questionIndex < numQuestions; i++, questionIndex++) {
            const item = studentEvaluations.numericResponses[questionIndex]
            // Calculate average excluding "No aplica" (0) ratings
            const validResponses = item.responses.filter((r: number) => r > 0)
            const avgScore =
                validResponses.length > 0 ? validResponses.reduce((a: number, b: number) => a + b, 0) / validResponses.length : 0
            const barY = pageStartY + i * 25 // Fixed spacing per question
            const barWidth = Math.max((avgScore / 5) * (contentWidth * 0.35), 12) // Better proportion
            const barHeight = PDF_CONSTANTS.DATA_BAR_HEIGHT + 6

            // Background bar
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.grayLight[0],
                PDF_CONSTANTS.COLORS.grayLight[1],
                PDF_CONSTANTS.COLORS.grayLight[2]
            )
            doc.rect(marginLeft + 5, barY, contentWidth * 0.35, barHeight, "F")

            // Value bar
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.secondary[0],
                PDF_CONSTANTS.COLORS.secondary[1],
                PDF_CONSTANTS.COLORS.secondary[2]
            )
            doc.rect(marginLeft + 5, barY, barWidth, barHeight, "F")

            // Question text with proper wrapping
            const fullQuestionTitle = item.question.title
            const textStartX = marginLeft + contentWidth * 0.42
            const maxWidth = contentWidth * 0.55 // Available width for text

            setTypography(doc, "regular")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

            // Split text to fit available width
            const lines = doc.splitTextToSize(fullQuestionTitle, maxWidth)
            const maxLines = 2 // Limit to 2 lines per question

            for (let lineIndex = 0; lineIndex < Math.min(lines.length, maxLines); lineIndex++) {
                doc.text(lines[lineIndex], textStartX, barY + 4 + lineIndex * 8)
            }

            // Add score after the question text
            const scoreY = barY + 4 + Math.min(lines.length, maxLines) * 8 + 4
            doc.text(`Promedio: ${avgScore.toFixed(1)}`, textStartX, scoreY)
        }

        currentY = pageStartY + containerHeight + PDF_CONSTANTS.SECTION_SPACING
    }

    return currentY
}

// Clean histogram chart
const drawHistogram = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    const contentWidth = getContentWidth(doc)
    const chartHeight = 80 // Increased height for better proportions
    const containerHeight = PDF_CONSTANTS.HEADER_HEIGHT + PDF_CONSTANTS.SECTION_SPACING + chartHeight + 35

    y = checkPageBreak(doc, y, containerHeight)

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "HISTOGRAMA DE CALIFICACIONES", y, marginLeft)
    const currentY = y

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)

    // Create histogram data (0-5 scale)
    const histogramData = Array.from({ length: 6 }, (_, i) => {
        const score = i
        const count = allResponses.filter((response: number) => Math.floor(response) === score).length
        return { score, count }
    }).filter((item) => item.count > 0)

    if (histogramData.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos para mostrar histograma", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Draw histogram bars with better proportions and spacing
    const maxCount = Math.max(...histogramData.map((d) => d.count))
    const barWidth = Math.max(12, (contentWidth * 0.7) / histogramData.length - 8) // Dynamic width, minimum 12pt
    const availableWidth = contentWidth * 0.8
    const totalBarWidth = histogramData.length * barWidth
    const spacing = histogramData.length > 1 ? (availableWidth - totalBarWidth) / (histogramData.length - 1) : 0

    histogramData.forEach((data, index) => {
        const barX = marginLeft + 20 + index * (barWidth + spacing)
        const barHeight = Math.max((data.count / maxCount) * chartHeight, 8)

        // Bar with improved color
        doc.setFillColor(PDF_CONSTANTS.COLORS.accent[0], PDF_CONSTANTS.COLORS.accent[1], PDF_CONSTANTS.COLORS.accent[2])
        doc.rect(barX, currentY + chartHeight - barHeight, barWidth, barHeight, "F")

        // Labels with better font size
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
        doc.text(`${data.score}`, barX + barWidth / 2, currentY + chartHeight + 12, { align: "center" })
        doc.text(`${data.count}`, barX + barWidth / 2, currentY + chartHeight + 22, { align: "center" })
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean performance categories chart
const drawPerformanceCategories = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    y = checkPageBreak(doc, y, 100)
    const contentWidth = getContentWidth(doc)

    // Calculate dynamic height based on active categories
    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    const activeCategories = [5, 4, 3, 2, 1, 0].filter(
        (score) => allResponses.filter((r: number) => Math.floor(r) === score).length > 0
    ).length
    const containerHeight = Math.max(50 + activeCategories * 18, 100) // Scale with data, minimum 100pt

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "CATEGORÍAS DE DESEMPEÑO", y, marginLeft)
    const currentY = y

    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const categories = [
        {
            label: "5 (Excelente)",
            range: "5",
            color: PDF_CONSTANTS.COLORS.primary,
            bgColor: PDF_CONSTANTS.COLORS.primaryLight,
            textColor: PDF_CONSTANTS.COLORS.primary,
        },
        {
            label: "4 (Muy Bueno)",
            range: "4",
            color: PDF_CONSTANTS.COLORS.secondary,
            bgColor: PDF_CONSTANTS.COLORS.secondaryLight,
            textColor: PDF_CONSTANTS.COLORS.secondary,
        },
        {
            label: "3 (Bueno)",
            range: "3",
            color: PDF_CONSTANTS.COLORS.accent,
            bgColor: PDF_CONSTANTS.COLORS.accentLight,
            textColor: PDF_CONSTANTS.COLORS.accent,
        },
        {
            label: "2 (Regular)",
            range: "2",
            color: PDF_CONSTANTS.COLORS.neutral,
            bgColor: PDF_CONSTANTS.COLORS.neutralLight,
            textColor: PDF_CONSTANTS.COLORS.neutral,
        },
        {
            label: "1 (Deficiente)",
            range: "1",
            color: PDF_CONSTANTS.COLORS.neutralLight,
            bgColor: PDF_CONSTANTS.COLORS.grayLight,
            textColor: PDF_CONSTANTS.COLORS.neutral,
        },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => {
            const num = Number(r)
            switch (category.range) {
                case "5":
                    return num === 5
                case "4":
                    return num === 4
                case "3":
                    return num === 3
                case "2":
                    return num === 2
                case "1":
                    return num === 1
                case "0":
                    return num === 0
                default:
                    return false
            }
        }).length

        if (count > 0) {
            const boxY = currentY + index * (PDF_CONSTANTS.LINE_SPACING + 12)
            const percentage = (count / allResponses.length) * 100

            // Category box with better proportions
            doc.setFillColor(category.bgColor[0], category.bgColor[1], category.bgColor[2])
            doc.rect(marginLeft + 5, boxY, contentWidth - 10, PDF_CONSTANTS.CONTAINER_HEIGHT, "F")
            doc.setDrawColor(category.color[0], category.color[1], category.color[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft + 5, boxY, contentWidth - 10, PDF_CONSTANTS.CONTAINER_HEIGHT)

            // Label and count with better font size
            setTypography(doc, "regular")
            doc.setTextColor(category.textColor[0], category.textColor[1], category.textColor[2])
            doc.text(`${category.label} (${category.range})`, marginLeft + 10, boxY + 8)

            // Progress bar background with better proportions
            const progressBarX = marginLeft + contentWidth * 0.5
            const progressBarWidth = contentWidth * 0.4
            doc.setFillColor(240, 240, 240)
            doc.rect(progressBarX, boxY + 3, progressBarWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT + 4, "F")

            // Progress bar value with minimum width
            const progressValueWidth = Math.max((percentage / 100) * progressBarWidth, 8)
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(progressBarX, boxY + 3, progressValueWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT + 4, "F")

            // Percentage with better alignment
            setTypography(doc, "regular")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            doc.text(`${percentage.toFixed(1)}%`, marginLeft + contentWidth - 25, boxY + 8, { align: "right" })
        }
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Draw grade timeline that shows teacher performance evolution over semesters
const drawGradeTimeline = (doc: jsPDF, marginLeft: number, y: number, semesterAverages: any[]): number => {
    y = checkPageBreak(doc, y, 140)
    const contentWidth = getContentWidth(doc)

    // Dynamic height based on number of semesters
    const numSemesters = semesterAverages?.length || 0
    const containerHeight = Math.max(100 + numSemesters * 10, 140) // Scale with semesters, minimum 140pt

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "LÍNEA DE TIEMPO DE NOTAS DOCENTES", y, marginLeft)
    const currentY = y

    if (!semesterAverages || semesterAverages.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos de evaluaciones por semestre disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Sort semester averages by semester chronologically
    const sortedSemesters = semesterAverages.sort((a, b) => a.semester.localeCompare(b.semester))

    // Draw timeline header with better spacing
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text("Evolución del promedio de calificaciones por semestre (escala 1-5)", marginLeft + 5, currentY + 5)

    // Draw timeline points and connections with better proportions
    const timelineStartY = currentY + 20
    const timelineHeight = 70 // Increased height
    const maxScore = 5
    const minScore = 0

    sortedSemesters.forEach((semesterData, index) => {
        const x = marginLeft + 15 + (index * (contentWidth - 30)) / Math.max(sortedSemesters.length - 1, 1)
        const score = semesterData.universityAverage || 0
        const yPos = timelineStartY + timelineHeight - ((score - minScore) / (maxScore - minScore)) * timelineHeight

        // Draw semester label horizontally with better spacing
        const semesterName = semesterData.semesterName || `Semestre ${semesterData.semester}`
        const labelX = x
        const labelY = timelineStartY + timelineHeight + 18

        // Draw background for semester label with better proportions
        const labelTextWidth = doc.getTextWidth(semesterName)
        doc.setFillColor(PDF_CONSTANTS.COLORS.grayLight[0], PDF_CONSTANTS.COLORS.grayLight[1], PDF_CONSTANTS.COLORS.grayLight[2])
        doc.rect(labelX - labelTextWidth / 2 - 4, labelY - 4, labelTextWidth + 8, 12, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.border[0], PDF_CONSTANTS.COLORS.border[1], PDF_CONSTANTS.COLORS.border[2])
        doc.rect(labelX - labelTextWidth / 2 - 4, labelY - 4, labelTextWidth + 8, 12)

        // Draw semester name with better font
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
        doc.text(semesterName, labelX, labelY + 4, { align: "center" })

        // Draw point on timeline with larger radius
        const pointRadius = 4
        doc.setFillColor(PDF_CONSTANTS.COLORS.secondary[0], PDF_CONSTANTS.COLORS.secondary[1], PDF_CONSTANTS.COLORS.secondary[2])
        doc.circle(x, yPos, pointRadius, "F")

        // Draw score value above the point with better visibility
        const scoreText = score.toFixed(1)
        const textWidth = doc.getTextWidth(scoreText)
        doc.setFillColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
        doc.rect(x - textWidth / 2 - 3, yPos - 15, textWidth + 6, 10, "F")

        // Draw the score value with white text
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.white[0], PDF_CONSTANTS.COLORS.white[1], PDF_CONSTANTS.COLORS.white[2])
        doc.text(scoreText, x, yPos - 10, { align: "center" })

        // Draw connecting line to next point (if not last) with better width
        if (index < sortedSemesters.length - 1) {
            const nextSemester = sortedSemesters[index + 1]
            const nextScore = nextSemester.universityAverage || 0
            const nextX = marginLeft + 15 + ((index + 1) * (contentWidth - 30)) / Math.max(sortedSemesters.length - 1, 1)
            const nextY = timelineStartY + timelineHeight - ((nextScore - minScore) / (maxScore - minScore)) * timelineHeight

            doc.setDrawColor(
                PDF_CONSTANTS.COLORS.secondary[0],
                PDF_CONSTANTS.COLORS.secondary[1],
                PDF_CONSTANTS.COLORS.secondary[2]
            )
            doc.setLineWidth(2)
            doc.line(x, yPos, nextX, nextY)
        }

        // Draw evaluation count below the point with better background
        const evalText = `${semesterData.count} evaluación${semesterData.count !== 1 ? "es" : ""}`
        const evalTextWidth = doc.getTextWidth(evalText)

        doc.setFillColor(PDF_CONSTANTS.COLORS.grayLight[0], PDF_CONSTANTS.COLORS.grayLight[1], PDF_CONSTANTS.COLORS.grayLight[2])
        doc.rect(x - evalTextWidth / 2 - 3, yPos + 10, evalTextWidth + 6, 10, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.border[0], PDF_CONSTANTS.COLORS.border[1], PDF_CONSTANTS.COLORS.border[2])
        doc.rect(x - evalTextWidth / 2 - 3, yPos + 10, evalTextWidth + 6, 10)

        // Draw evaluation count with better font
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
        doc.text(evalText, x, yPos + 15, { align: "center" })
    })

    // Draw Y-axis labels (score scale) with better spacing
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

    // Y-axis title with better positioning
    doc.saveGraphicsState()
    doc.text("Calificación", marginLeft - 18, timelineStartY + timelineHeight / 2, { angle: 90 })
    doc.restoreGraphicsState()

    // Y-axis scale labels with better alignment
    for (let i = 0; i <= 5; i++) {
        const yLabel = timelineStartY + timelineHeight - (i / 5) * timelineHeight
        doc.text(i.toString(), marginLeft - 10, yLabel + 4, { align: "right" })

        // Draw horizontal grid line with better visibility
        doc.setDrawColor(PDF_CONSTANTS.COLORS.border[0], PDF_CONSTANTS.COLORS.border[1], PDF_CONSTANTS.COLORS.border[2])
        doc.setLineWidth(0.3)
        doc.line(marginLeft + 8, yLabel, marginLeft + contentWidth - 8, yLabel)
    }

    // Draw summary statistics with better spacing
    const finalY = timelineStartY + timelineHeight + 45
    const totalEvaluations = sortedSemesters.reduce((sum, semester) => sum + semester.count, 0)
    const averageScore =
        sortedSemesters.reduce((sum, semester) => sum + (semester.universityAverage || 0), 0) / sortedSemesters.length

    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text(
        `Total de evaluaciones: ${totalEvaluations} | Promedio general: ${averageScore.toFixed(2)}/5`,
        marginLeft + 5,
        finalY
    )

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Draw trend indicator that matches the "Tendencia General" section from the web page
const drawTrendIndicator = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    y = checkPageBreak(doc, y, 40)
    const contentWidth = getContentWidth(doc)

    // Container with better proportions
    const containerHeight = 40

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos para calcular tendencia", marginLeft + 5, y + 18)
        return y + containerHeight
    }

    // Calculate if we have enough data for trend analysis (at least 2 questions)
    if (studentEvaluations.numericResponses.length < 2) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("Se necesitan al menos 2 preguntas para calcular tendencia", marginLeft + 5, y + 18)
        return y + containerHeight
    }

    // Calculate trend based on first vs last question performance
    const firstQuestion = studentEvaluations.numericResponses[0]
    const lastQuestion = studentEvaluations.numericResponses[studentEvaluations.numericResponses.length - 1]

    // Calculate averages excluding "No aplica" (0) ratings
    const firstValidResponses = firstQuestion.responses.filter((r: number) => r > 0)
    const lastValidResponses = lastQuestion.responses.filter((r: number) => r > 0)

    const firstAvg =
        firstValidResponses.length > 0
            ? firstValidResponses.reduce((a: number, b: number) => a + b, 0) / firstValidResponses.length
            : 0
    const lastAvg =
        lastValidResponses.length > 0
            ? lastValidResponses.reduce((a: number, b: number) => a + b, 0) / lastValidResponses.length
            : 0

    const isImproving = lastAvg > firstAvg
    const trendDifference = Math.abs(lastAvg - firstAvg)

    // Title with better font size
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text("TENDENCIA GENERAL:", marginLeft + 5, y + 15)

    // Trend indicator (arrow and difference) with better positioning
    const trendX = marginLeft + contentWidth * 0.7
    if (isImproving) {
        doc.setTextColor(PDF_CONSTANTS.COLORS.secondary[0], PDF_CONSTANTS.COLORS.secondary[1], PDF_CONSTANTS.COLORS.secondary[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.text("↗", trendX, y + 15)
        doc.text(`+${trendDifference.toFixed(2)}`, trendX + 15, y + 15)
    } else {
        doc.setTextColor(PDF_CONSTANTS.COLORS.accent[0], PDF_CONSTANTS.COLORS.accent[1], PDF_CONSTANTS.COLORS.accent[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.text("↘", trendX, y + 15)
        doc.text(`-${trendDifference.toFixed(2)}`, trendX + 15, y + 15)
    }

    // Subtitle with better font size
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
    doc.text("puntos de diferencia", trendX + 40, y + 15)

    // Description with better spacing
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text(`Primera pregunta (${firstAvg.toFixed(1)}) vs Última pregunta (${lastAvg.toFixed(1)})`, marginLeft + 5, y + 28)

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean chart generation function
const generateChartsInPDF = (
    doc: jsPDF,
    marginLeft: number,
    y: number,
    studentEvaluations: any,
    semesterAverages?: any[]
): number => {
    return drawChartsInPDF(doc, marginLeft, y, studentEvaluations, semesterAverages)
}

// Simplified test function to verify basic chart drawing
const drawTestCharts = (doc: jsPDF, marginLeft: number, y: number): number => {
    let currentY = y

    // Test container
    doc.setFillColor(
        PDF_CONSTANTS.COLORS.primaryLight[0],
        PDF_CONSTANTS.COLORS.primaryLight[1],
        PDF_CONSTANTS.COLORS.primaryLight[2]
    )
    doc.rect(marginLeft - 2, currentY - 2, 166, 50, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.5)
    doc.rect(marginLeft - 2, currentY - 2, 166, 50)

    // Test title
    doc.setFontSize(10)
    doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setFont("helvetica", "bold")
    doc.text("GRAFICOS DE PRUEBA", marginLeft, currentY + 6)
    currentY += 15

    // Test bars
    const testData = [
        { label: "Categoria A", value: 75, color: PDF_CONSTANTS.COLORS.primary },
        { label: "Categoria B", value: 50, color: PDF_CONSTANTS.COLORS.primaryLight },
        { label: "Categoria C", value: 25, color: PDF_CONSTANTS.COLORS.gray },
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
export const generateFeedbackPDF = async (
    professors: ProfessorService[],
    subjects: SubjectService[],
    options: FeedbackState,
    feedback: Feedback[],
    ratings: ReturnType<typeof import("@/lib/utils").ratingFeedback>,
    autoEvaluationAnswers: AutoEvaluationBySemester[],
    coevaluations: any[],
    studentEvaluations: {
        numericResponses: Array<{ question: Question; responses: number[] }>
        textResponses: Array<{ question: Question; responses: string[] }>
    },
    questions: Question[],
    semesterAverages?: Array<{
        semester: string
        average: number
        universityAverage: number
        count: number
        semesterName: string
    }>
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
    } catch {}
    const marginLeft = 20
    let y = 25

    // Get professor and subject names
    const professor = professors.find((p) => p.id === options.professorId)
    const subject = subjects.find((s) => s.id === options.subjectId)

    // Calculate semester averages for grade timeline
    const filteredFeedbackByPeriod = filterByPeriod(feedback, options.timeframe)
    const semesterAveragesData = (() => {
        // Group feedback by semester
        const feedbackBySemester = filteredFeedbackByPeriod.reduce(
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
            {} as Record<string, typeof filteredFeedbackByPeriod>
        )

        return Object.entries(feedbackBySemester)
            .map(([semester, semesterFeedback]: [string, any[]]) => {
                const avg = semesterFeedback.reduce((sum: number, item: any) => sum + item.rating, 0) / semesterFeedback.length
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

    // Use provided semesterAverages or calculated ones
    const finalSemesterAverages = semesterAverages || semesterAveragesData

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
    const timeframeDisplay =
        options.timeframe === "2023-01-01T00:00:00.000Z - 2050-01-01T00:00:00.000Z"
            ? "Todos los periodos"
            : formatSemester(options.timeframe || "")
    doc.text(`Periodo de tiempo: ${timeframeDisplay}`, marginLeft, y)
    y += 15

    // Summary Section with better proportions
    const summaryBoxHeight = 60
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

    doc.setFillColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.circle(marginLeft + 2, indicatorY - 1, 2.2, "F")
    doc.text(`* Calificacion promedio: ${avgRating.toFixed(1)}/5`, marginLeft + 8, indicatorY)
    y += indicatorSpacing

    doc.setFillColor(
        PDF_CONSTANTS.COLORS.primaryLight[0],
        PDF_CONSTANTS.COLORS.primaryLight[1],
        PDF_CONSTANTS.COLORS.primaryLight[2]
    )
    doc.circle(marginLeft + 2, indicatorY + 7, 2.2, "F")
    doc.text(`* Total de evaluaciones: ${filteredFeedback.length}`, marginLeft + 8, indicatorY + 8)
    y += indicatorSpacing

    doc.setFillColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
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
        doc.setFillColor(
            PDF_CONSTANTS.COLORS.primaryLight[0],
            PDF_CONSTANTS.COLORS.primaryLight[1],
            PDF_CONSTANTS.COLORS.primaryLight[2]
        )
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.setFont("helvetica", "bold")
        doc.text("[+] COMENTARIOS DE ESTUDIANTES", marginLeft, y + 2)
        y += 15

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")

        filteredFeedback.forEach((item: any, index: number) => {
            if (y > 240) {
                doc.addPage()
                y = 20
            }

            // Comment header with professor info
            const headerHeight = 12
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.primaryLight[0],
                PDF_CONSTANTS.COLORS.primaryLight[1],
                PDF_CONSTANTS.COLORS.primaryLight[2]
            )
            doc.rect(marginLeft, y - 3, 165, headerHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, headerHeight)

            doc.setFontSize(8)
            doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setFont("helvetica", "bold")
            doc.text(`Profesor: ${item.professor.first_name} ${item.professor.last_name}`, marginLeft + 3, y + 1)
            y += 8

            // Rating and date info
            doc.setFontSize(7)
            doc.setTextColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
            doc.setFont("helvetica", "normal")
            doc.text(
                `Calificacion: ${item.rating}/5 | Fecha: ${item.feedback_date ? new Date(item.feedback_date).toLocaleDateString("es-ES") : "Sin fecha"}`,
                marginLeft + 3,
                y
            )
            y += 8

            // Comment content box
            const commentLines = doc.splitTextToSize(item.feedback_text, 155)
            const commentBoxHeight = commentLines.length * 4 + 8

            doc.setFillColor(
                PDF_CONSTANTS.COLORS.grayLight[0],
                PDF_CONSTANTS.COLORS.grayLight[1],
                PDF_CONSTANTS.COLORS.grayLight[2]
            )
            doc.rect(marginLeft, y - 2, 165, commentBoxHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 2, 165, commentBoxHeight)

            doc.setFontSize(7)
            doc.setTextColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
            doc.setFont("helvetica", "normal")
            doc.text("Comentario:", marginLeft + 3, y + 2)
            y += 6

            doc.text(commentLines, marginLeft + 3, y)
            y += commentLines.length * 4 + 12
        })
    }

    // Charts Section - always show to ensure visibility
    if (y > 50) {
        doc.addPage()
        y = 20
    }

    // Section header - using new standards
    y = drawSectionHeader(doc, "GRAFICAS Y VISUALIZACIONES", y, marginLeft)

    // Use the actual student evaluations data
    y = generateChartsInPDF(doc, marginLeft, y, studentEvaluations, finalSemesterAverages)

    // Student Evaluations Section with enhanced visuals - always show
    if (y > 180) {
        doc.addPage()
        y = 20
    }

    // Section header with background
    doc.setFillColor(
        PDF_CONSTANTS.COLORS.primaryLight[0],
        PDF_CONSTANTS.COLORS.primaryLight[1],
        PDF_CONSTANTS.COLORS.primaryLight[2]
    )
    doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft - 5, y - 3, 170, 8)

    doc.setFontSize(11)
    doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setFont("helvetica", "bold")
    doc.text("[+] EVALUACIONES DE ESTUDIANTES", marginLeft, y + 2)
    y += 15

    // Check if there is data
    if (studentEvaluations.numericResponses.length === 0 && studentEvaluations.textResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay evaluaciones de estudiantes disponibles para mostrar", marginLeft + 5, y)
        y += 20
    } else {
        // Numeric Questions with semester-based scoring instead of bars
        studentEvaluations.numericResponses.forEach((item) => {
            if (y > 200) {
                doc.addPage()
                y = 20
            }

            // Question box with better proportions
            const questionBoxHeight = 14
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.primaryLight[0],
                PDF_CONSTANTS.COLORS.primaryLight[1],
                PDF_CONSTANTS.COLORS.primaryLight[2]
            )
            doc.rect(marginLeft, y - 3, 165, questionBoxHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, questionBoxHeight)

            doc.setFontSize(8)
            doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setFont("helvetica", "bold")
            doc.text(`[*] ${item.question.title}`, marginLeft + 3, y + 1)
            y += 10

            doc.setTextColor(0, 0, 0)
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")

            // Calculate average excluding "No aplica" (0) ratings
            const validResponses = item.responses.filter((r: number) => r > 0)
            const avg = validResponses.length > 0 ? validResponses.reduce((a, b) => a + b, 0) / validResponses.length : 0
            const min = Math.min(...item.responses)
            const max = Math.max(...item.responses)

            // Statistics with colored indicators
            doc.setFillColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.circle(marginLeft + 2, y - 1, 1.5, "F")
            doc.text(`Promedio: ${avg.toFixed(1)} | Rango: ${min}-${max} | Total: ${item.responses.length}`, marginLeft + 7, y)
            y += 10

            // Semester-based scoring instead of bars
            const semesterScores =
                finalSemesterAverages?.map((semester) => {
                    // Calculate average for this question in this semester
                    // For now, we'll use the overall average as placeholder since we don't have per-semester question data
                    return {
                        semester: semester.semesterName,
                        score: avg.toFixed(1),
                        count: Math.floor(item.responses.length / (finalSemesterAverages?.length || 1)),
                    }
                }) || []

            if (semesterScores.length > 0) {
                semesterScores.forEach((semesterData) => {
                    if (y > 250) {
                        doc.addPage()
                        y = 20
                    }

                    // Semester score display
                    doc.setFillColor(
                        PDF_CONSTANTS.COLORS.secondary[0],
                        PDF_CONSTANTS.COLORS.secondary[1],
                        PDF_CONSTANTS.COLORS.secondary[2]
                    )
                    doc.circle(marginLeft + 7, y - 1, 1.5, "F")
                    doc.text(
                        `${semesterData.semester}: ${semesterData.score}/5 (${semesterData.count} evaluaciones)`,
                        marginLeft + 12,
                        y
                    )
                    y += 6
                })
            } else {
                // Fallback if no semester data
                doc.text("Nota por semestre: No disponible", marginLeft + 7, y)
                y += 6
            }

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
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.primaryLight[0],
                PDF_CONSTANTS.COLORS.primaryLight[1],
                PDF_CONSTANTS.COLORS.primaryLight[2]
            )
            doc.rect(marginLeft, y - 3, 165, textQuestionBoxHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, textQuestionBoxHeight)

            doc.setFontSize(8)
            doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
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
                doc.setFillColor(
                    PDF_CONSTANTS.COLORS.grayLight[0],
                    PDF_CONSTANTS.COLORS.grayLight[1],
                    PDF_CONSTANTS.COLORS.grayLight[2]
                )
                doc.rect(marginLeft + 3, y - 2, 160, responseBoxHeight, "F")
                doc.setDrawColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
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
        doc.setFillColor(
            PDF_CONSTANTS.COLORS.primaryLight[0],
            PDF_CONSTANTS.COLORS.primaryLight[1],
            PDF_CONSTANTS.COLORS.primaryLight[2]
        )
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
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
                doc.setFillColor(
                    PDF_CONSTANTS.COLORS.primaryLight[0],
                    PDF_CONSTANTS.COLORS.primaryLight[1],
                    PDF_CONSTANTS.COLORS.primaryLight[2]
                )
                doc.rect(marginLeft, y - 2, 165, semesterBoxHeight, "F")
                doc.setDrawColor(
                    PDF_CONSTANTS.COLORS.primary[0],
                    PDF_CONSTANTS.COLORS.primary[1],
                    PDF_CONSTANTS.COLORS.primary[2]
                )
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
                        doc.setFillColor(
                            PDF_CONSTANTS.COLORS.grayLight[0],
                            PDF_CONSTANTS.COLORS.grayLight[1],
                            PDF_CONSTANTS.COLORS.grayLight[2]
                        )
                        doc.rect(marginLeft + 3, y - 2, 160, answerBoxHeight, "F")
                        doc.setDrawColor(
                            PDF_CONSTANTS.COLORS.primary[0],
                            PDF_CONSTANTS.COLORS.primary[1],
                            PDF_CONSTANTS.COLORS.primary[2]
                        )
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
        doc.setFillColor(PDF_CONSTANTS.COLORS.grayLight[0], PDF_CONSTANTS.COLORS.grayLight[1], PDF_CONSTANTS.COLORS.grayLight[2])
        doc.rect(marginLeft - 5, y - 3, 170, 8, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
        doc.setLineWidth(0.3)
        doc.rect(marginLeft - 5, y - 3, 170, 8)

        doc.setFontSize(11)
        doc.setTextColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
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
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.grayLight[0],
                PDF_CONSTANTS.COLORS.grayLight[1],
                PDF_CONSTANTS.COLORS.grayLight[2]
            )
            doc.rect(marginLeft, y - 3, 165, coevaluationHeaderHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft, y - 3, 165, coevaluationHeaderHeight)

            doc.setFontSize(8)
            doc.setFont("helvetica", "bold")
            doc.text(
                `${index + 1}. Semestre: ${coevaluation.semestre ? formatSemester(coevaluation.semestre) : "Sin semestre"}`,
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
                `Semestre: ${coevaluation.semestre ? formatSemester(coevaluation.semestre) : "Sin semestre"}`,
                marginLeft + 3,
                y
            )
            y += 5
            doc.text(
                `Admin: ${coevaluation.admin ? `${coevaluation.admin.first_name} ${coevaluation.admin.last_name}` : "N/A"}`,
                marginLeft + 3,
                y
            )
            y += 8

            // Findings section with better proportions
            const findingsBoxHeight = 8
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.grayLight[0],
                PDF_CONSTANTS.COLORS.grayLight[1],
                PDF_CONSTANTS.COLORS.grayLight[2]
            )
            doc.rect(marginLeft + 3, y - 2, 160, findingsBoxHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
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
            doc.setFillColor(
                PDF_CONSTANTS.COLORS.grayLight[0],
                PDF_CONSTANTS.COLORS.grayLight[1],
                PDF_CONSTANTS.COLORS.grayLight[2]
            )
            doc.rect(marginLeft + 3, y - 2, 160, planBoxHeight, "F")
            doc.setDrawColor(PDF_CONSTANTS.COLORS.gray[0], PDF_CONSTANTS.COLORS.gray[1], PDF_CONSTANTS.COLORS.gray[2])
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

    // Footer with enhanced styling using new standards
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Footer background
        doc.setFillColor(
            PDF_CONSTANTS.COLORS.background[0],
            PDF_CONSTANTS.COLORS.background[1],
            PDF_CONSTANTS.COLORS.background[2]
        )
        doc.rect(
            0,
            doc.internal.pageSize.getHeight() - PDF_CONSTANTS.FOOTER_HEIGHT,
            doc.internal.pageSize.getWidth(),
            PDF_CONSTANTS.FOOTER_HEIGHT,
            "F"
        )

        // Footer line
        doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.setLineWidth(1)
        doc.line(
            PDF_CONSTANTS.MARGIN,
            doc.internal.pageSize.getHeight() - PDF_CONSTANTS.FOOTER_HEIGHT,
            doc.internal.pageSize.getWidth() - PDF_CONSTANTS.MARGIN,
            doc.internal.pageSize.getHeight() - PDF_CONSTANTS.FOOTER_HEIGHT
        )

        // Page number with better styling
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - PDF_CONSTANTS.FOOTER_HEIGHT + 8,
            { align: "center" }
        )

        // Footer text with better styling
        setTypography(doc, "small")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text(
            "Sistema de Evaluación Docente - Universidad El Bosque",
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - PDF_CONSTANTS.FOOTER_HEIGHT + 14,
            { align: "center" }
        )
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
