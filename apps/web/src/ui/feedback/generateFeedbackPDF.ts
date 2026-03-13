import jsPDF from "jspdf"
import type { Feedback, ProfessorService, SubjectService, Question } from "@/lib/@types/services"
import type { FeedbackState } from "@/lib/@types/types"

// Executive Summary PDF - Complete Redesign
export const generateExecutiveSummaryPDF = async (
    professors: ProfessorService[],
    subjects: SubjectService[],
    options: FeedbackState,
    feedback: Feedback[],
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
    }>,
    summaryRating?: number
) => {
    const doc = new jsPDF()

    // Set PDF properties
    doc.setProperties({
        title: "Resumen Ejecutivo - Evaluación Docente",
        subject: "Sistema de Evaluación Docente",
        author: "Universidad El Bosque",
        keywords: "resumen, evaluación, docente",
        creator: "Sistema de Evaluación Docente UEB",
    })

    doc.setFont("helvetica")
    const marginLeft = 5
    const contentWidth = 200
    let y = 10

    // Get professor and subject names
    const professor = professors.find((p) => p.id === options.professorId)
    const subject = subjects.find((s) => s.id === options.subjectId)

    const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    // Calculate key metrics
    let allResponses: number[] = []
    let avgScore = 0
    let totalResponses = 0
    let bestQuestion = { name: "N/A", avg: 0 }
    let worstQuestion = { name: "N/A", avg: 0 }

    const quantitativeScore = summaryRating || 0

    if (studentEvaluations.numericResponses.length > 0) {
        studentEvaluations.numericResponses.forEach((item) => {
            allResponses = [...allResponses, ...item.responses]
        })

        if (allResponses.length > 0) {
            avgScore = allResponses.reduce((sum, val) => sum + val, 0) / allResponses.length
            totalResponses = allResponses.length

            // Find best and worst questions (full text)
            const questionAvgs = studentEvaluations.numericResponses.map((item) => ({
                name: item.question.title || "Pregunta sin título",
                avg: item.responses.reduce((a, b) => a + b, 0) / item.responses.length,
            }))

            if (questionAvgs.length > 0) {
                bestQuestion = [...questionAvgs].sort((a, b) => b.avg - a.avg)[0]
                worstQuestion = [...questionAvgs].sort((a, b) => a.avg - b.avg)[0]
            }
        }
    }

    // Determine level
    let levelText: string
    let levelColor: number[]
    if (avgScore >= 4.5) {
        levelText = "EXCELENTE"
        levelColor = [34, 197, 94]
    } else if (avgScore >= 3.5) {
        levelText = "BUENO"
        levelColor = [59, 130, 246]
    } else if (avgScore >= 2.5) {
        levelText = "REGULAR"
        levelColor = [245, 158, 11]
    } else {
        levelText = "NECESITA MEJORAR"
        levelColor = [239, 68, 68]
    }

    // Calculate median and standard deviation
    let medianScore = 0
    let stdDev = 0
    if (allResponses.length > 0) {
        const sorted = [...allResponses].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        medianScore = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2

        const mean = avgScore
        const squareDiffs = allResponses.map((val) => Math.pow(val - mean, 2))
        const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length
        stdDev = Math.sqrt(avgSquareDiff)
    }

    // Calculate trend
    let trend = 0
    let trendText = "Sin datos suficientes"
    if (semesterAverages && semesterAverages.length >= 2) {
        const firstSemester = semesterAverages[0]
        const lastSemester = semesterAverages[semesterAverages.length - 1]
        trend = lastSemester.average - firstSemester.average
        if (trend > 0.1) trendText = "MEJORANDO"
        else if (trend < -0.1) trendText = "EN DECLIVE"
        else trendText = "ESTABLE"
    }

    // ========== 1. TITLE ==========
    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, 210, 15, "F")

    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("RESUMEN EJECUTIVO", 105, 7, { align: "center" })

    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text("Evaluación Docente - Universidad El Bosque", 105, 12, { align: "center" })

    y = 18

    // ========== 2. COURSE INFO ==========
    doc.setFillColor(240, 245, 250)
    doc.rect(marginLeft, y, contentWidth, 20, "F")
    doc.setDrawColor(200, 210, 220)
    doc.setLineWidth(0.5)
    doc.rect(marginLeft, y, contentWidth, 20)

    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "bold")
    doc.text("Docente:", marginLeft + 5, y + 6)
    doc.setFont("helvetica", "normal")
    const professorName = professor ? `${professor.first_name} ${professor.last_name}` : "No seleccionado"
    const professorSplit = doc.splitTextToSize(professorName, 55) // Limitar ancho para evitar superposición
    doc.text(professorSplit, marginLeft + 25, y + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Materia:", marginLeft + 90, y + 6)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const subjectName = subject ? subject.name : "No seleccionada"
    const subjectSplit = doc.splitTextToSize(subjectName, 55) // Limitar ancho para el espacio disponible
    doc.text(subjectSplit, marginLeft + 112, y + 6)
    doc.setFontSize(10)

    doc.setFont("helvetica", "bold")
    doc.text("Periodo:", marginLeft + 5, y + 15)
    doc.setFont("helvetica", "normal")
    let periodText = "Todos los semestres"

    // Only show specific semester if we have a valid date range and it's not a full year or old default date
    if (options.timeframe && options.timeframe.includes(" - ")) {
        const parts = options.timeframe.split(" - ")
        if (parts.length === 2) {
            const startDateStr = parts[0].split("T")[0]
            const endDateStr = parts[1].split("T")[0]

            if (
                startDateStr &&
                endDateStr &&
                !isNaN(new Date(startDateStr).getTime()) &&
                !isNaN(new Date(endDateStr).getTime())
            ) {
                const startDate = new Date(startDateStr)
                const endDate = new Date(endDateStr)
                const year = startDate.getFullYear()

                // Check if it's a full year range (January to December) or an old default date (2022 or earlier)
                const isFullYear =
                    startDate.getMonth() === 0 &&
                    startDate.getDate() === 1 &&
                    endDate.getMonth() === 11 &&
                    (endDate.getDate() === 31 || endDate.getDate() === 30)
                const isOldDefaultDate = year <= 2022

                if (!isFullYear && !isOldDefaultDate) {
                    const month = startDate.getMonth() + 1 // getMonth() returns 0-11
                    const semester = month <= 6 ? "1" : "2"
                    periodText = `${year} - Semestre ${semester}`
                }
                // If it's a full year or old default date, keep "Todos los semestres"
            }
        }
    }

    doc.text(periodText, marginLeft + 25, y + 15)

    doc.setFont("helvetica", "bold")
    doc.text("Fecha:", marginLeft + 90, y + 15)
    doc.setFont("helvetica", "normal")
    doc.text(currentDate, marginLeft + 108, y + 15)

    y += 25

    // ========== 3. EXECUTIVE CONCLUSION ==========
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, y, contentWidth, 8, "F")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("CONCLUSIÓN EJECUTIVA", marginLeft + 5, y + 6)

    y += 10
    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, contentWidth, 18, "F")
    doc.setDrawColor(200, 210, 220)
    doc.rect(marginLeft, y, contentWidth, 18)

    doc.setFontSize(8)
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "normal")

    const conclusionText =
        `El docente obtuvo una calificación promedio de ${avgScore.toFixed(1)}/5.0, ubicándose en un nivel de desempeño ${levelText.toLowerCase()}. ` +
        (worstQuestion.name !== "N/A" && bestQuestion.name !== "N/A" && worstQuestion.name !== bestQuestion.name
            ? `Los resultados muestran oportunidades de mejora en "${bestQuestion.name.substring(0, 30)}", mientras que "${worstQuestion.name.substring(0, 30)}" presenta mejor valoración. `
            : "Los resultados permiten identificar aspectos a fortalecer en la práctica docente. ") +
        (semesterAverages && semesterAverages.length >= 2
            ? `La tendencia frente al semestre anterior se mantiene ${trendText.toLowerCase()}.`
            : "")

    const splitConclusion = doc.splitTextToSize(conclusionText, contentWidth - 10)
    doc.text(splitConclusion, marginLeft + 5, y + 6)

    y += 23

    // ========== 4. KEY INDICATORS ==========
    doc.setFillColor(30, 41, 59)
    doc.rect(marginLeft, y, contentWidth, 8, "F")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("INDICADORES CLAVE", marginLeft + 5, y + 6)

    y += 10
    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, contentWidth, 26, "F")
    doc.setDrawColor(200, 210, 220)
    doc.rect(marginLeft, y, contentWidth, 26)

    // Left column indicators
    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "bold")
    doc.text("Calificación actitudes docente en clase:", marginLeft + 5, y + 5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(levelColor[0], levelColor[1], levelColor[2])
    doc.text(`${avgScore.toFixed(1)} / 5.0`, marginLeft + 5, y + 8)

    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "bold")
    doc.text("Nota media estudiantes docente:", marginLeft + 5, y + 11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(levelColor[0], levelColor[1], levelColor[2])
    doc.text(`${(summaryRating || avgScore).toFixed(1)} / 5.0`, marginLeft + 5, y + 14)

    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "bold")
    doc.text("Nivel de desempeño:", marginLeft + 5, y + 17)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(levelColor[0], levelColor[1], levelColor[2])
    doc.text(levelText, marginLeft + 5, y + 20)

    // Right column indicators
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "bold")
    doc.text("Total evaluaciones:", marginLeft + 95, y + 6)
    doc.setFont("helvetica", "normal")
    doc.text(`${Math.round(totalResponses / 11)}`, marginLeft + 135, y + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Desviación estándar:", marginLeft + 95, y + 13)
    doc.setFont("helvetica", "normal")
    doc.text(`±${stdDev.toFixed(2)}`, marginLeft + 135, y + 13)

    doc.setFont("helvetica", "bold")
    doc.text("Tendencia:", marginLeft + 95, y + 20)
    if (trend > 0.1) doc.setTextColor(34, 197, 94)
    else if (trend < -0.1) doc.setTextColor(239, 68, 68)
    else doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    doc.text(
        trendText + (trend !== 0 && semesterAverages?.length ? ` (${trend > 0 ? "+" : ""}${trend.toFixed(2)})` : ""),
        marginLeft + 135,
        y + 20
    )

    y += 35

    // ========== 5. GRADE DISTRIBUTION ==========
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, y, contentWidth, 8, "F")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("DISTRIBUCIÓN DE CALIFICACIONES", marginLeft + 5, y + 6)

    y += 10
    doc.setFillColor(250, 250, 252)
    doc.rect(marginLeft, y, contentWidth, 22, "F")
    doc.setDrawColor(220, 220, 230)
    doc.rect(marginLeft, y, contentWidth, 22)

    if (allResponses.length > 0) {
        const categories = [
            { name: "Excelente", range: [5, 5], color: [34, 197, 94], label: "5" },
            { name: "Bueno", range: [4, 4], color: [59, 130, 246], label: "4" },
            { name: "Regular", range: [3, 3], color: [245, 158, 11], label: "3" },
            { name: "Bajo", range: [2, 2], color: [249, 115, 22], label: "2" },
            { name: "Deficiente", range: [1, 1], color: [239, 68, 68], label: "1" },
        ]

        const barStartX = marginLeft + 45
        const barMaxWidth = 85
        const maxValue = Math.max(
            ...categories.map((c) => allResponses.filter((r) => r >= c.range[0] && r <= c.range[1]).length),
            1
        )

        // Find dominant level for highlighting
        const categoriesWithPct = categories.map((cat) => ({
            ...cat,
            count: allResponses.filter((r) => r >= cat.range[0] && r <= cat.range[1]).length,
            percentage:
                allResponses.length > 0
                    ? (allResponses.filter((r) => r >= cat.range[0] && r <= cat.range[1]).length / allResponses.length) * 100
                    : 0,
        }))
        const dominant = categoriesWithPct.reduce((prev, curr) => (curr.percentage > prev.percentage ? curr : prev))

        categoriesWithPct.forEach((category, index) => {
            const count = category.count
            const percentage = category.percentage
            const barWidth = (count / maxValue) * barMaxWidth

            const rowY = y + 5 + index * 3

            // Label with number
            doc.setFontSize(6)
            doc.setTextColor(60, 60, 60)
            doc.setFont("helvetica", "bold")
            doc.text(category.label + " - " + category.name, marginLeft + 5, rowY + 2)

            // Background bar
            doc.setFillColor(230, 230, 235)
            doc.rect(barStartX, rowY, barMaxWidth, 4, "F")

            // Value bar - highlight dominant
            doc.setFillColor(category.color[0], category.color[1], category.color[2])
            doc.rect(barStartX, rowY, Math.max(barWidth, 2), 4, "F")

            // Percentage - positioned to avoid overlap
            doc.setFont("helvetica", category === dominant ? "bold" : "normal")
            doc.setFontSize(category === dominant ? 6 : 5)
            doc.setTextColor(
                category === dominant ? levelColor[0] : 40,
                category === dominant ? levelColor[1] : 40,
                category === dominant ? levelColor[2] : 40
            )
            doc.text(percentage.toFixed(0) + "%", barStartX + barMaxWidth + 8, rowY + 2, { align: "left" })
        })
    } else {
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.setFont("helvetica", "normal")
        doc.text("No hay datos disponibles", marginLeft + contentWidth / 2, y + 12, { align: "center" })
    }

    y += 26

    // ========== 6. PERFORMANCE TREND ==========
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, y, contentWidth, 8, "F")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("TENDENCIA DE DESEMPEÑO", marginLeft + 5, y + 6)

    y += 10
    doc.setFillColor(250, 250, 252)
    doc.rect(marginLeft, y, contentWidth, 20, "F")
    doc.setDrawColor(220, 220, 230)
    doc.rect(marginLeft, y, contentWidth, 20)

    if (semesterAverages && semesterAverages.length >= 1) {
        // Table header
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.setFont("helvetica", "bold")
        doc.text("Periodo", marginLeft + 5, y + 6)
        doc.text("Promedio", marginLeft + 60, y + 6)

        doc.setDrawColor(220, 220, 230)
        doc.line(marginLeft + 50, y + 4, marginLeft + 50, y + 16)

        // Show up to 3 semesters
        const displaySemesters = semesterAverages.slice(-3)
        displaySemesters.forEach((sem, index) => {
            const rowY = y + 10 + index * 4
            doc.setFont("helvetica", "normal")
            doc.setTextColor(30, 41, 59)
            doc.text(sem.semesterName || sem.semester, marginLeft + 5, rowY)
            doc.setFont("helvetica", "bold")
            doc.text(sem.average.toFixed(2) + " / 5.0", marginLeft + 60, rowY)
        })
    } else {
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.setFont("helvetica", "normal")
        doc.text("Se necesita más de un semestre para mostrar tendencia", marginLeft + contentWidth / 2, y + 10, {
            align: "center",
        })
    }

    y += 22

    // ========== 7. GRADE HISTORY ==========
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, y, contentWidth, 8, "F")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("HISTORIAL DE NOTAS", marginLeft + 5, y + 6)

    y += 10
    doc.setFillColor(250, 250, 252)
    doc.rect(marginLeft, y, contentWidth, 40, "F")
    doc.setDrawColor(220, 220, 230)
    doc.rect(marginLeft, y, contentWidth, 40)

    if (semesterAverages && semesterAverages.length > 0) {
        const semestersWithNotes = semesterAverages.filter((sem) => sem.count > 0).slice(-5) // Last 5 semesters
        if (semestersWithNotes.length > 0) {
            const barWidth = 20
            const maxBarHeight = 25
            const maxAvg = 5
            const startX = marginLeft + 20
            const baseY = y + 35

            semestersWithNotes.forEach((sem, index) => {
                const barHeight = (sem.average / maxAvg) * maxBarHeight
                const barX = startX + index * 30
                const barY = baseY - barHeight

                // Draw bar
                doc.setFillColor(59, 130, 246)
                doc.rect(barX, barY, barWidth, barHeight, "F")

                // Draw border
                doc.setDrawColor(30, 41, 59)
                doc.setLineWidth(0.5)
                doc.rect(barX, barY, barWidth, barHeight)

                // Label semester
                doc.setFontSize(6)
                doc.setTextColor(30, 41, 59)
                doc.setFont("helvetica", "normal")
                doc.text(sem.semesterName || sem.semester, barX + barWidth / 2, baseY + 5, { align: "center" })

                // Label average
                doc.setFontSize(6)
                doc.setTextColor(30, 41, 59)
                doc.setFont("helvetica", "bold")
                doc.text(sem.average.toFixed(1), barX + barWidth / 2, barY - 2, { align: "center" })
            })

            // Draw axis
            doc.setDrawColor(100, 100, 100)
            doc.line(startX - 5, baseY, startX + semestersWithNotes.length * 30, baseY)
            doc.line(startX - 5, baseY, startX - 5, baseY - maxBarHeight)

            // Axis labels
            doc.setFontSize(6)
            doc.setTextColor(100, 100, 100)
            doc.text("0", startX - 10, baseY + 2)
            doc.text("5", startX - 10, baseY - maxBarHeight + 2)
        } else {
            doc.setFontSize(8)
            doc.setTextColor(120, 120, 120)
            doc.setFont("helvetica", "normal")
            doc.text("No hay historial disponible", marginLeft + contentWidth / 2, y + 20, { align: "center" })
        }
    } else {
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.setFont("helvetica", "normal")
        doc.text("No hay historial disponible", marginLeft + contentWidth / 2, y + 20, { align: "center" })
    }

    y += 45

    // ========== 8. RECOMMENDATIONS ==========
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, y, contentWidth, 8, "F")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("RECOMENDACIONES", marginLeft + 5, y + 6)

    y += 10
    doc.setFillColor(248, 250, 252)
    doc.rect(marginLeft, y, contentWidth, 25, "F")
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.rect(marginLeft, y, contentWidth, 25)

    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    doc.setFont("helvetica", "normal")

    let recommendations = ""
    if (worstQuestion.name !== "N/A") {
        recommendations =
            `1. Revisar y mejorar "${worstQuestion.name.substring(0, 50)}" según las evaluaciones de los estudiantes.\n` +
            `2. Mantener y fortalecer "${bestQuestion.name.substring(0, 50)}" que ha sido bien valorado.\n` +
            "3. Implementar estrategias pedagógicas adicionales para mejorar la comprensión del contenido."
    } else {
        recommendations =
            "1. Continuar con las buenas prácticas docentes identificadas.\n" +
            "2. Realizar seguimiento periódicamente para monitorear mejoras.\n" +
            "3. Promover la participación de más estudiantes en las evaluaciones."
    }

    const splitRecommendations = doc.splitTextToSize(recommendations, contentWidth - 10)
    doc.text(splitRecommendations, marginLeft + 5, y + 6)

    y += 30

    // ========== 9. FOOTER ==========
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFillColor(30, 41, 59)
    doc.rect(0, pageHeight - 12, 210, 12, "F")

    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("Sistema de Evaluación Docente | Universidad El Bosque", 105, pageHeight - 7, { align: "center" })

    doc.setFontSize(6)
    doc.setTextColor(200, 200, 200)
    doc.setFont("helvetica", "normal")
    doc.text(`Reporte generado automáticamente el ${currentDate}`, 105, pageHeight - 2, { align: "center" })

    // Generate filename
    const professorFileName = professor ? `${professor.first_name}_${professor.last_name}` : "profesor"
    const subjectFileName = subject ? subject.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "") : "materia"
    const fileName = `Resumen_Ejecutivo_${professorFileName}_${subjectFileName}_${currentDate.replace(/\s+/g, "_")}.pdf`

    try {
        doc.save(fileName)
    } catch (error) {
        console.error("Error saving executive summary PDF:", error)
        doc.save("Resumen_Ejecutivo.pdf")
    }
}
