import jsPDF from "jspdf"
import type { Feedback, ProfessorService, SubjectService, AutoEvaluationBySemester, Question } from "@/lib/@types/services"
import type { FeedbackState } from "@/lib/@types/types"
import { filterByPeriod, getAverageRatings, formatSemester } from "@/lib/utils"

export const PDF_CONSTANTS = {
    MARGIN: 20,
    LINE_SPACING: 6,
    SECTION_SPACING: 12,
    HEADER_HEIGHT: 10,
    DATA_BAR_HEIGHT: 6,
    CONTAINER_HEIGHT: 18,
    FOOTER_HEIGHT: 15,
    COLORS: {
        primary: [59, 130, 246],
        success: [34, 197, 94],
        warning: [245, 158, 11],
        danger: [239, 68, 68],
        background: [240, 244, 255],
        text: [30, 41, 59],
        textLight: [100, 100, 100],
        border: [220, 220, 220],
        white: [255, 255, 255],
    },
    TYPOGRAPHY: {
        mainTitle: { size: 16, font: "bold" },
        sectionTitle: { size: 11, font: "bold" },
        regular: { size: 9, font: "normal" },
        small: { size: 7, font: "normal" },
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
    y = checkPageBreak(doc, y, 100)
    const contentWidth = getContentWidth(doc)

    // Main container with dynamic width and proper height
    const containerHeight = 100
    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.5)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "ANÁLISIS ESTADÍSTICO GENERAL", y, marginLeft)
    const currentY = y

    // Get responses - use real data when available
    const allResponses = studentEvaluations.numericResponses?.flatMap((item: any) => item.responses) || []

    // Use real data if available, otherwise show message
    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const dataToUse = allResponses

    // Calculate statistics
    const avg = dataToUse.reduce((a: number, b: number) => a + b, 0) / dataToUse.length
    const min = Math.min(...dataToUse)
    const max = Math.max(...dataToUse)
    const median = [...dataToUse].sort((a, b) => a - b)[Math.floor(dataToUse.length / 2)]

    // Left side: Score distribution bars - improved layout
    const leftSectionWidth = contentWidth * 0.45
    const barX = marginLeft + 5
    const barY = currentY

    const categories = [
        { name: "Excelente (9-10)", range: [9, 10], color: PDF_CONSTANTS.COLORS.success },
        { name: "Bueno (7-8)", range: [7, 8], color: PDF_CONSTANTS.COLORS.primary },
        { name: "Regular (5-6)", range: [5, 6], color: PDF_CONSTANTS.COLORS.warning },
        { name: "Deficiente (0-4)", range: [0, 4], color: PDF_CONSTANTS.COLORS.danger },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => r >= category.range[0] && r <= category.range[1]).length
        if (count > 0) {
            const currentBarY = barY + index * (PDF_CONSTANTS.LINE_SPACING + 6)
            const percentage = (count / allResponses.length) * 100
            const barWidth = Math.max((count / allResponses.length) * (leftSectionWidth - 60), 5)

            // Label first
            setTypography(doc, "small")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            doc.text(`${category.name}:`, barX, currentBarY + 5)
            doc.text(`${count}`, barX + leftSectionWidth - 25, currentBarY + 5, { align: "right" })

            // Bar below the label
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(barX + 2, currentBarY + 8, barWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT, "F")
        }
    })

    // Right side: Statistics boxes - improved layout and alignment
    const rightSectionX = marginLeft + contentWidth * 0.52
    const boxWidth = contentWidth * 0.43
    const boxHeight = 14
    const stats = [
        { label: "Promedio General", value: avg.toFixed(1), color: PDF_CONSTANTS.COLORS.primary },
        { label: "Mediana", value: median.toFixed(1), color: PDF_CONSTANTS.COLORS.success },
        { label: "Rango", value: `${min} - ${max}`, color: PDF_CONSTANTS.COLORS.warning },
        { label: "Total Evaluaciones", value: allResponses.length.toString(), color: [139, 92, 246] },
    ]

    stats.forEach((stat, index) => {
        const statY = currentY + index * (boxHeight + 4)

        // Background box - better proportions
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
        doc.rect(rightSectionX, statY, boxWidth, boxHeight, "F")

        // Value (white text) - positioned in upper half
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.white[0], PDF_CONSTANTS.COLORS.white[1], PDF_CONSTANTS.COLORS.white[2])
        doc.text(stat.value, rightSectionX + boxWidth / 2, statY + 6, { align: "center" })

        // Label (darker text below the box)
        setTypography(doc, "small")
        doc.setTextColor(60, 60, 60)
        doc.text(stat.label, rightSectionX + boxWidth / 2, statY + boxHeight + 3, { align: "center" })
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean score distribution chart
const drawScoreDistribution = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    y = checkPageBreak(doc, y, 80)
    const contentWidth = getContentWidth(doc)

    // Container with proper spacing
    const containerHeight = 80
    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "DISTRIBUCIÓN DE CALIFICACIONES", y, marginLeft)
    const currentY = y

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const categories = [
        { name: "Excelente (9-10)", range: [9, 10], color: PDF_CONSTANTS.COLORS.success },
        { name: "Bueno (7-8)", range: [7, 8], color: PDF_CONSTANTS.COLORS.primary },
        { name: "Regular (5-6)", range: [5, 6], color: PDF_CONSTANTS.COLORS.warning },
        { name: "Deficiente (0-4)", range: [0, 4], color: PDF_CONSTANTS.COLORS.danger },
    ]

    categories.forEach((category, index) => {
        const count = allResponses.filter((r: number) => r >= category.range[0] && r <= category.range[1]).length
        if (count > 0) {
            const barY = currentY + index * (PDF_CONSTANTS.LINE_SPACING + 6)
            const percentage = (count / allResponses.length) * 100
            const barWidth = Math.max((percentage / 100) * (contentWidth * 0.6), 3)

            // Label
            setTypography(doc, "regular")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            doc.text(`${category.name}:`, marginLeft + 5, barY + 5)

            // Background bar
            doc.setFillColor(240, 240, 240)
            doc.rect(marginLeft + contentWidth * 0.35, barY, contentWidth * 0.6, PDF_CONSTANTS.DATA_BAR_HEIGHT + 2, "F")

            // Value bar
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(marginLeft + contentWidth * 0.35, barY, barWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT + 2, "F")

            // Percentage
            setTypography(doc, "regular")
            doc.text(`${percentage.toFixed(1)}%`, marginLeft + contentWidth * 0.95, barY + 5, { align: "right" })
        }
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean performance trends chart
const drawPerformanceTrends = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    if (y > 180) {
        doc.addPage()
        return 20
    }

    // Container with proper height calculation - increased width and better spacing
    const maxQuestions = Math.min(studentEvaluations.numericResponses.length, 5)
    const containerHeight = 20 + maxQuestions * 15 + 10

    doc.setFillColor(254, 240, 238)
    doc.rect(marginLeft, y, getContentWidth(doc), containerHeight, "F")
    doc.setDrawColor(251, 146, 60)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, getContentWidth(doc), containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "TENDENCIAS DE DESEMPEÑO", y, marginLeft)
    const currentY = y

    if (studentEvaluations.numericResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles para mostrar", marginLeft + 5, currentY)
        return y + containerHeight
    }

    // Draw bars for each question (max 5)
    for (let i = 0; i < maxQuestions; i++) {
        const item = studentEvaluations.numericResponses[i]
        const avgScore = item.responses.reduce((a: number, b: number) => a + b, 0) / item.responses.length
        const barY = currentY + i * (PDF_CONSTANTS.LINE_SPACING + 10)
        const barWidth = Math.max((avgScore / 10) * (getContentWidth(doc) * 0.5), 3)
        const barHeight = PDF_CONSTANTS.DATA_BAR_HEIGHT + 4

        // Background bar
        doc.setFillColor(254, 249, 231)
        doc.rect(marginLeft + 5, barY, getContentWidth(doc) * 0.5, barHeight, "F")

        // Value bar
        doc.setFillColor(251, 146, 60)
        doc.rect(marginLeft + 5, barY, barWidth, barHeight, "F")

        // Question label (truncated)
        const questionTitle = item.question.title.length > 30 ? item.question.title.substring(0, 30) + "..." : item.question.title

        setTypography(doc, "small")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
        doc.text(`${questionTitle}: ${avgScore.toFixed(1)}`, marginLeft + getContentWidth(doc) * 0.55, barY + 6)
    }

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean histogram chart
const drawHistogram = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    const contentWidth = getContentWidth(doc)
    const chartHeight = 70
    const containerHeight = PDF_CONSTANTS.HEADER_HEIGHT + PDF_CONSTANTS.SECTION_SPACING + chartHeight + 25

    y = checkPageBreak(doc, y, containerHeight)

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "HISTOGRAMA DE CALIFICACIONES", y, marginLeft)
    const currentY = y

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)

    // Create histogram data (0-10 scale)
    const histogramData = Array.from({ length: 11 }, (_, i) => {
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

    // Draw histogram bars with dynamic width
    const maxCount = Math.max(...histogramData.map((d) => d.count))
    const barWidth = 10
    const availableWidth = contentWidth * 0.8
    const spacing = histogramData.length > 1 ? (availableWidth - histogramData.length * barWidth) / (histogramData.length - 1) : 0

    histogramData.forEach((data, index) => {
        const barX = marginLeft + 15 + index * (barWidth + spacing)
        const barHeight = Math.max((data.count / maxCount) * chartHeight, 3)

        // Bar
        doc.setFillColor(107, 114, 128)
        doc.rect(barX, currentY + chartHeight - barHeight, barWidth, barHeight, "F")

        // Labels
        setTypography(doc, "small")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
        doc.text(`${data.score}`, barX + 4, currentY + chartHeight + 10)
        doc.text(`${data.count}`, barX + 4, currentY + chartHeight + 18)
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Clean performance categories chart
const drawPerformanceCategories = (doc: jsPDF, marginLeft: number, y: number, studentEvaluations: any): number => {
    y = checkPageBreak(doc, y, 80)
    const contentWidth = getContentWidth(doc)

    // Container with proper dimensions
    const containerHeight = 80

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(71, 85, 105)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    // Title using helper function
    y = drawSectionHeader(doc, "CATEGORÍAS DE DESEMPEÑO", y, marginLeft)
    const currentY = y

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos disponibles", marginLeft + 5, currentY)
        return y + containerHeight
    }

    const categories = [
        {
            label: "Excelente",
            range: "9-10",
            color: PDF_CONSTANTS.COLORS.success,
            bgColor: [220, 252, 231],
            textColor: [21, 128, 61],
        },
        { label: "Bueno", range: "7-8", color: PDF_CONSTANTS.COLORS.primary, bgColor: [219, 234, 254], textColor: [29, 78, 216] },
        {
            label: "Regular",
            range: "5-6",
            color: PDF_CONSTANTS.COLORS.warning,
            bgColor: [254, 243, 199],
            textColor: [154, 52, 18],
        },
        {
            label: "Deficiente",
            range: "0-4",
            color: PDF_CONSTANTS.COLORS.danger,
            bgColor: [254, 228, 226],
            textColor: [220, 38, 38],
        },
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
            const boxY = currentY + index * (PDF_CONSTANTS.LINE_SPACING + 10)
            const percentage = (count / allResponses.length) * 100

            // Category box
            doc.setFillColor(category.bgColor[0], category.bgColor[1], category.bgColor[2])
            doc.rect(marginLeft + 5, boxY, contentWidth - 10, PDF_CONSTANTS.CONTAINER_HEIGHT - 4, "F")
            doc.setDrawColor(category.color[0], category.color[1], category.color[2])
            doc.setLineWidth(0.3)
            doc.rect(marginLeft + 5, boxY, contentWidth - 10, PDF_CONSTANTS.CONTAINER_HEIGHT - 4)

            // Label and count
            setTypography(doc, "regular")
            doc.setTextColor(category.textColor[0], category.textColor[1], category.textColor[2])
            doc.text(`${category.label} (${category.range})`, marginLeft + 10, boxY + 7)

            // Progress bar background
            const progressBarX = marginLeft + contentWidth * 0.45
            const progressBarWidth = contentWidth * 0.4
            doc.setFillColor(240, 240, 240)
            doc.rect(progressBarX, boxY + 2, progressBarWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT + 2, "F")

            // Progress bar value
            const progressValueWidth = Math.max((percentage / 100) * progressBarWidth, 3)
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(progressBarX, boxY + 2, progressValueWidth, PDF_CONSTANTS.DATA_BAR_HEIGHT + 2, "F")

            // Percentage
            setTypography(doc, "small")
            doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
            doc.text(`${percentage.toFixed(1)}%`, marginLeft + contentWidth - 25, boxY + 7, { align: "right" })
        }
    })

    return y + containerHeight + PDF_CONSTANTS.SECTION_SPACING
}

// Draw grade timeline that shows teacher performance evolution over semesters
const drawGradeTimeline = (doc: jsPDF, marginLeft: number, y: number, semesterAverages: any[]): number => {
    y = checkPageBreak(doc, y, 100)
    const contentWidth = getContentWidth(doc)

    // Container with proper dimensions
    const containerHeight = 100
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

    // Draw timeline header
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text("Evolución del promedio de calificaciones por semestre (escala 1-5)", marginLeft + 5, currentY)

    // Draw timeline points and connections
    const timelineStartY = currentY + 15
    const timelineHeight = 60
    const maxScore = 5
    const minScore = 0

    sortedSemesters.forEach((semesterData, index) => {
        const x = marginLeft + 10 + (index * (contentWidth - 20)) / Math.max(sortedSemesters.length - 1, 1)
        const score = semesterData.universityAverage || 0
        const yPos = timelineStartY + timelineHeight - ((score - minScore) / (maxScore - minScore)) * timelineHeight

        // Draw semester label (rotated for better fit)
        setTypography(doc, "small")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

        // Save current transformation matrix
        doc.saveGraphicsState()

        // Translate and rotate for vertical text
        const semesterName = semesterData.semesterName || `Semestre ${semesterData.semester}`
        const labelX = x
        const labelY = timelineStartY + timelineHeight + 15

        // Draw semester name horizontally (better readability) with background
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

        // Draw background for semester label
        const labelTextWidth = doc.getTextWidth(semesterName)
        doc.setFillColor(245, 245, 245)
        doc.rect(labelX - labelTextWidth / 2 - 3, labelY - 3, labelTextWidth + 6, 10, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.border[0], PDF_CONSTANTS.COLORS.border[1], PDF_CONSTANTS.COLORS.border[2])
        doc.rect(labelX - labelTextWidth / 2 - 3, labelY - 3, labelTextWidth + 6, 10)

        // Draw semester name
        doc.text(semesterName, labelX, labelY + 4, { align: "center" })

        // Restore transformation matrix
        doc.restoreGraphicsState()

        // Draw point on timeline
        const pointRadius = 3
        doc.setFillColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
        doc.circle(x, yPos, pointRadius, "F")

        // Draw score value above the point with better visibility
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.white[0], PDF_CONSTANTS.COLORS.white[1], PDF_CONSTANTS.COLORS.white[2])

        // Draw background box for better readability
        const scoreText = score.toFixed(1)
        const textWidth = doc.getTextWidth(scoreText)
        doc.setFillColor(0, 0, 0)
        doc.rect(x - textWidth / 2 - 2, yPos - 12, textWidth + 4, 8, "F")

        // Draw the score value
        doc.text(scoreText, x, yPos - 8, { align: "center" })

        // Draw connecting line to next point (if not last)
        if (index < sortedSemesters.length - 1) {
            const nextSemester = sortedSemesters[index + 1]
            const nextScore = nextSemester.universityAverage || 0
            const nextX = marginLeft + 10 + ((index + 1) * (contentWidth - 20)) / Math.max(sortedSemesters.length - 1, 1)
            const nextY = timelineStartY + timelineHeight - ((nextScore - minScore) / (maxScore - minScore)) * timelineHeight

            doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
            doc.setLineWidth(1.5)
            doc.line(x, yPos, nextX, nextY)
        }

        // Draw evaluation count below the point with background
        setTypography(doc, "small")
        doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

        const evalText = `${semesterData.count} evaluación${semesterData.count !== 1 ? "es" : ""}`
        const evalTextWidth = doc.getTextWidth(evalText)

        // Draw background for evaluation count
        doc.setFillColor(250, 250, 250)
        doc.rect(x - evalTextWidth / 2 - 2, yPos + 8, evalTextWidth + 4, 8, "F")
        doc.setDrawColor(PDF_CONSTANTS.COLORS.border[0], PDF_CONSTANTS.COLORS.border[1], PDF_CONSTANTS.COLORS.border[2])
        doc.rect(x - evalTextWidth / 2 - 2, yPos + 8, evalTextWidth + 4, 8)

        // Draw evaluation count
        doc.text(evalText, x, yPos + 12, { align: "center" })
    })

    // Draw Y-axis labels (score scale)
    setTypography(doc, "small")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])

    // Y-axis title
    doc.saveGraphicsState()
    doc.text("Calificación", marginLeft - 15, timelineStartY + timelineHeight / 2, { angle: 90 })
    doc.restoreGraphicsState()

    // Y-axis scale labels
    for (let i = 0; i <= 5; i++) {
        const yLabel = timelineStartY + timelineHeight - (i / 5) * timelineHeight
        doc.text(i.toString(), marginLeft - 8, yLabel + 3, { align: "right" })

        // Draw horizontal grid line
        doc.setDrawColor(PDF_CONSTANTS.COLORS.border[0], PDF_CONSTANTS.COLORS.border[1], PDF_CONSTANTS.COLORS.border[2])
        doc.setLineWidth(0.2)
        doc.line(marginLeft + 5, yLabel, marginLeft + contentWidth - 5, yLabel)
    }

    // Draw summary statistics
    const finalY = timelineStartY + timelineHeight + 35
    const totalEvaluations = sortedSemesters.reduce((sum, semester) => sum + semester.count, 0)
    const averageScore =
        sortedSemesters.reduce((sum, semester) => sum + (semester.universityAverage || 0), 0) / sortedSemesters.length

    setTypography(doc, "small")
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
    y = checkPageBreak(doc, y, 30)
    const contentWidth = getContentWidth(doc)

    // Container with proper dimensions
    const containerHeight = 30

    doc.setFillColor(PDF_CONSTANTS.COLORS.background[0], PDF_CONSTANTS.COLORS.background[1], PDF_CONSTANTS.COLORS.background[2])
    doc.rect(marginLeft, y, contentWidth, containerHeight, "F")
    doc.setDrawColor(PDF_CONSTANTS.COLORS.primary[0], PDF_CONSTANTS.COLORS.primary[1], PDF_CONSTANTS.COLORS.primary[2])
    doc.setLineWidth(0.3)
    doc.rect(marginLeft, y, contentWidth, containerHeight)

    const allResponses = studentEvaluations.numericResponses.flatMap((item: any) => item.responses)
    if (allResponses.length === 0) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("No hay datos para calcular tendencia", marginLeft + 5, y + 15)
        return y + containerHeight
    }

    // Calculate if we have enough data for trend analysis (at least 2 questions)
    if (studentEvaluations.numericResponses.length < 2) {
        setTypography(doc, "regular")
        doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
        doc.text("Se necesitan al menos 2 preguntas para calcular tendencia", marginLeft + 5, y + 15)
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
    setTypography(doc, "regular")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text("TENDENCIA GENERAL:", marginLeft + 5, y + 12)

    // Trend indicator (arrow and difference)
    const trendX = marginLeft + contentWidth * 0.7
    if (isImproving) {
        doc.setTextColor(PDF_CONSTANTS.COLORS.success[0], PDF_CONSTANTS.COLORS.success[1], PDF_CONSTANTS.COLORS.success[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.text("↗", trendX, y + 12)
        doc.text(`+${trendDifference.toFixed(2)}`, trendX + 12, y + 12)
    } else {
        doc.setTextColor(PDF_CONSTANTS.COLORS.danger[0], PDF_CONSTANTS.COLORS.danger[1], PDF_CONSTANTS.COLORS.danger[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.text("↘", trendX, y + 12)
        doc.text(`-${trendDifference.toFixed(2)}`, trendX + 12, y + 12)
    }

    // Subtitle
    setTypography(doc, "small")
    doc.setTextColor(PDF_CONSTANTS.COLORS.textLight[0], PDF_CONSTANTS.COLORS.textLight[1], PDF_CONSTANTS.COLORS.textLight[2])
    doc.text("puntos de diferencia", trendX + 35, y + 12)

    // Description
    setTypography(doc, "small")
    doc.setTextColor(PDF_CONSTANTS.COLORS.text[0], PDF_CONSTANTS.COLORS.text[1], PDF_CONSTANTS.COLORS.text[2])
    doc.text(`Primera pregunta (${firstAvg.toFixed(1)}) vs Última pregunta (${lastAvg.toFixed(1)})`, marginLeft + 5, y + 22)

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
    doc.text(`Periodo de tiempo: ${options.timeframe ? formatSemester(options.timeframe) : "No seleccionado"}`, marginLeft, y)
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

        filteredFeedback.forEach((item: any, index: number) => {
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
                `Calificacion: ${item.rating}/10 | Fecha: ${item.feedback_date ? new Date(item.feedback_date).toLocaleDateString("es-ES") : "Sin fecha"}`,
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
    const hasStudentEvaluations = studentEvaluations.numericResponses.length > 0 || studentEvaluations.textResponses.length > 0
    const hasFeedbackData = feedback.length > 0

    // Show charts section if we have any data OR force for testing
    if (hasStudentEvaluations || hasFeedbackData) {
        // Always start charts section on a new page if we're not at the beginning
        if (y > 50) {
            doc.addPage()
            y = 20
        }

        // Section header - using new standards
        y = drawSectionHeader(doc, "GRAFICAS Y VISUALIZACIONES", y, marginLeft)

        // Use the actual student evaluations data
        y = generateChartsInPDF(doc, marginLeft, y, studentEvaluations, finalSemesterAverages)
    } else {
        // Force chart generation even without data to see what happens
        if (y > 50) {
            doc.addPage()
            y = 20
        }
        y = drawSectionHeader(doc, "GRAFICAS Y VISUALIZACIONES", y, marginLeft)
        y = generateChartsInPDF(doc, marginLeft, y, studentEvaluations)
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
