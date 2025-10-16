import jsPDF from "jspdf"
import type { Report } from "./@types/reports"
import type { ProfessorService, SubjectService } from "@/lib/@types/services"
import { ReportState } from "@/ui/report/report"
import logoUEB from "@/assets/ueb.png"
import logoMGOP from "@/assets/MGOP_EGDP.png"
import logoGDP from "@/assets/GDPCirclo.png"

export const generateSavedReportPDF = (reports: Report[], reportId: string) => {
    const savedReport = reports.find((r) => r.id === reportId)
    if (!savedReport) return

    const doc = new jsPDF()
    const marginLeft = 20
    let y = 20

    const currentDate = new Date(savedReport.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, 210, 30, "F")
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DOCENTE HISTÓRICO", 105, 20, { align: "center" })

    y = 40
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Docente: ${savedReport.professor_name || "No disponible"}`, marginLeft, y)
    y += 8
    doc.text(`Materia: ${savedReport.subject_name || "No disponible"}`, marginLeft, y)
    y += 8
    doc.text(`Fecha del informe: ${currentDate}`, marginLeft, y)
    y += 10

    doc.setDrawColor(200, 200, 200)
    doc.line(marginLeft, y, 190, y)
    y += 10

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Resumen del Reporte", marginLeft, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")

    const summary = [
        `Título: ${savedReport.title}`,
        `Periodo evaluado: ${currentDate}`,
        `Materia: ${savedReport.subject_name}`,
        "Comentarios:",
        ...doc.splitTextToSize(savedReport.comments || "No se registraron comentarios.", 170),
        "",
        "Recomendaciones:",
        ...doc.splitTextToSize(savedReport.recommendations || "No se registraron recomendaciones.", 170),
    ]

    doc.text(summary, marginLeft, y)

    let finalY = y + summary.length * 6 + 20
    if (finalY > 240) {
        doc.addPage()
        finalY = 20
    }

    doc.addImage(logoMGOP.src, "PNG", 55, finalY, 100, 40)
    const secondaryY = finalY + 45
    doc.addImage(logoGDP.src, "PNG", 60, secondaryY, 40, 25)
    doc.addImage(logoUEB.src, "PNG", 120, secondaryY, 40, 25)

    doc.setDrawColor(180, 180, 180)
    doc.line(20, 285, 190, 285)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Sistema de Evaluacion Docente Programas Postgrados Gerencia de Proyectos - Universidad El bosque", 105, 290, {
        align: "center",
    })

    doc.save(`Reporte_Historico_${savedReport.professor_name}_${currentDate.replace(/ /g, "_")}.pdf`)
}

export const generateNewReportPDF = (report: ReportState, professors: ProfessorService[], subjects: SubjectService[]) => {
    if (!report.title || !report.professor || !report.subject) {
        alert("Complete título, profesor y materia antes de generar el PDF")
        return
    }

    const doc = new jsPDF()
    const marginLeft = 20
    let y = 20

    const professor = professors.find((p) => p.id === report.professor)
    const subject = subjects.find((s) => s.id === report.subject)
    const currentDate = new Date().toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    doc.setFillColor(30, 41, 59)
    doc.rect(0, 0, 210, 30, "F")
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DOCENTE", 105, 20, { align: "center" })

    y = 40
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Docente: ${professor?.first_name} ${professor?.last_name}`, marginLeft, y)
    y += 8
    doc.text(`Materia: ${subject?.name || "N/A"}`, marginLeft, y)
    y += 8
    doc.text(`Fecha: ${currentDate}`, marginLeft, y)
    y += 10

    doc.setDrawColor(200, 200, 200)
    doc.line(marginLeft, y, 190, y)
    y += 10

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Análisis y Comentarios", marginLeft, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    const commentLines = doc.splitTextToSize(report.comments || "No se registraron comentarios.", 170)
    doc.text(commentLines, marginLeft, y)
    y += commentLines.length * 6 + 10

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Recomendaciones", marginLeft, y)
    y += 8
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    const recLines = doc.splitTextToSize(report.recommendations || "No se registraron recomendaciones.", 170)
    doc.text(recLines, marginLeft, y)
    y += recLines.length * 6 + 10

    // Add images at the end of the PDF
    if (y > 240) {
        doc.addPage()
        y = 20
    }
    doc.addImage(logoMGOP.src, "PNG", 55, y, 100, 40)
    const secondaryY = y + 45
    doc.addImage(logoGDP.src, "PNG", 60, secondaryY, 40, 25)
    doc.addImage(logoUEB.src, "PNG", 120, secondaryY, 40, 25)
    doc.setDrawColor(180, 180, 180)
    doc.line(20, 285, 190, 285)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text("Sistema de Evaluacion Docente Programas Postgrados Gerencia de Proyectos - Universidad El Bosque", 105, 290, {
        align: "center",
    })

    doc.save(`Reporte_Docente_${professor?.last_name}_${currentDate.replace(/ /g, "_")}.pdf`)
}
