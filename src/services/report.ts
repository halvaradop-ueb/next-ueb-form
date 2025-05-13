import { supabase } from "@/lib/supabase/client"
export interface Report {
    id: string
    title: string
    professor_id: string
    professor_name: string
    subject_id: string
    subject_name: string
    comments?: string
    recommendations?: string
    status: "draft" | "published"
    created_at: string
    professor?: {
        id: string
        first_name: string
        last_name: string
        email?: string
    }
    subject?: {
        id: string
        name: string
        code?: string
    }
}
export interface CreateReportDto {
    title: string
    professor_id: string
    subject_id: string
    comments?: string
    recommendations?: string
    status?: "draft" | "published"
}
type SupabaseReportResponse = {
    id: string
    title: string
    professor_id: string | null
    subject_id: string | null
    comments?: string | null
    recommendations?: string | null
    status: "draft" | "published"
    created_at: string
    professor?:
        | {
              id: string
              first_name: string
              last_name: string
              email?: string
          }[]
        | null
    subject?:
        | {
              id: string
              name: string
              code?: string
          }[]
        | null
}
const mapReport = (data: SupabaseReportResponse): Report => {
    const professor = data.professor?.[0]
    const subject = data.subject?.[0]
    return {
        id: data.id,
        title: data.title,
        professor_id: data.professor_id || professor?.id || "",
        professor_name: professor ? `${professor.first_name} ${professor.last_name}` : "",
        subject_id: data.subject_id || subject?.id || "",
        subject_name: subject?.name || "",
        comments: data.comments || undefined,
        recommendations: data.recommendations || undefined,
        status: data.status,
        created_at: data.created_at,
        professor: professor
            ? {
                  id: professor.id,
                  first_name: professor.first_name,
                  last_name: professor.last_name,
                  email: professor.email,
              }
            : undefined,
        subject: subject
            ? {
                  id: subject.id,
                  name: subject.name,
                  code: subject.code,
              }
            : undefined,
    }
}
export const getReports = async (): Promise<Report[]> => {
    try {
        const { data, error } = await supabase
            .from("report")
            .select(
                `
        id,
        title,
        professor_id,
        subject_id,
        comments,
        recommendations,
        status,
        created_at,
        professor:professor_id (
          id,
          first_name,
          last_name,
          email
        ),
        subject:subject_id (
          id,
          name,
          code
        )
      `,
            )
            .order("created_at", { ascending: false })

        if (error) throw new Error(error.message)
        return data ? data.map(mapReport) : []
    } catch (error) {
        console.error("Error fetching reports:", error)
        return []
    }
}
export const createReport = async (reportData: CreateReportDto): Promise<Report | null> => {
    try {
        const professor = (
            await supabase.from("professors").select("first_name, last_name").eq("id", reportData.professor_id).single()
        ).data

        const subject = (await supabase.from("subjects").select("name").eq("id", reportData.subject_id).single()).data

        if (!professor || !subject) {
            throw new Error("No se encontró profesor o materia")
        }

        const { data, error } = await supabase
            .from("report")
            .insert({
                title: reportData.title,
                professor_id: reportData.professor_id,
                professor_name: `${professor.first_name} ${professor.last_name}`,
                subject_id: reportData.subject_id,
                subject_name: subject.name,
                comments: reportData.comments || null,
                recommendations: reportData.recommendations || null,
                status: reportData.status || "draft",
            })
            .select(
                `
        id,
        title,
        professor_id,
        professor_name,
        subject_id,
        subject_name,
        comments,
        recommendations,
        status,
        created_at
      `,
            )
            .single()

        if (error) throw new Error(error.message)
        const fullReport = await supabase
            .from("report")
            .select(
                `
        *,
        professor:professor_id (*),
        subject:subject_id (*)
      `,
            )
            .eq("id", data.id)
            .single()

        return fullReport.data ? mapReport(fullReport.data) : null
    } catch (error) {
        console.error("Error creating report:", error)
        return null
    }
}
