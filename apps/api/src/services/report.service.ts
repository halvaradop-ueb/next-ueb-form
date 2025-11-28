import { supabase } from "../lib/supabase.js"
import { Report, CreateReportDto } from "@ueb/types/report"

export const getReports = async (): Promise<Report[]> => {
    try {
        const { data, error } = await supabase
            .from("report")
            .select(
                `
                *,
                User:professor_id (
                    id,
                    first_name,
                    last_name,
                    email
                ),
                Subject:subject_id (
                    id,
                    name,
                    description,
                    semestre
                )
            `
            )
            .order("created_at", { ascending: false })
        if (error) throw error

        if (!data) return []

        return data.map((item: any) => {
            const professorObj = item.User
            const subjectObj = item.Subject

            return {
                id: item.id,
                title: item.title || "Sin título",
                professor_id: item.professor_id || "",
                subject_id: item.subject_id || "",
                comments: item.comments || undefined,
                recommendations: item.recommendations || undefined,
                created_at: item.created_at,
                semester: item.semester || null,
                professor_name: professorObj ? `${professorObj.first_name} ${professorObj.last_name}` : "Profesor desconocido",
                subject_name: subjectObj?.name || "Materia desconocida",
                professor: professorObj
                    ? {
                          id: professorObj.id,
                          first_name: professorObj.first_name,
                          last_name: professorObj.last_name,
                          email: professorObj.email,
                      }
                    : undefined,
                subject: subjectObj
                    ? {
                          id: subjectObj.id,
                          name: subjectObj.name,
                          description: subjectObj.description,
                      }
                    : undefined,
            } as Report
        })
    } catch (error) {
        console.error("Error fetching reports:", error)
        return []
    }
}

export async function createReport(reportData: CreateReportDto): Promise<Report | null> {
    try {
        const { data: newReport, error } = await supabase
            .from("report")
            .insert({
                title: reportData.title,
                professor_id: reportData.professor_id,
                subject_id: reportData.subject_id,
                comments: reportData.comments || null,
                recommendations: reportData.recommendations || null,
                semester: reportData.semester || null,
            })
            .select(
                `
                *,
                User:professor_id (
                    id,
                    first_name,
                    last_name,
                    email
                ),
                Subject:subject_id (
                    id,
                    name,
                    description,
                    semestre
                )
            `
            )
            .single()

        if (error || !newReport) throw new Error(error?.message || "No se pudo crear el reporte")

        // Transform the created report to include professor_name and subject_name
        const professorObj = newReport.User
        const subjectObj = newReport.Subject

        return {
            ...newReport,
            professor_name: professorObj ? `${professorObj.first_name} ${professorObj.last_name}` : "Profesor desconocido",
            subject_name: subjectObj?.name || "Materia desconocida",
            professor: professorObj
                ? {
                      id: professorObj.id,
                      first_name: professorObj.first_name,
                      last_name: professorObj.last_name,
                      email: professorObj.email,
                  }
                : undefined,
            subject: subjectObj
                ? {
                      id: subjectObj.id,
                      name: subjectObj.name,
                      description: subjectObj.description,
                  }
                : undefined,
        } as Report
    } catch (error) {
        console.error("Error creating report:", error)
        return null
    }
}
