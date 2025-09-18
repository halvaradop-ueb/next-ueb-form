import { Report, CreateReportDto } from "@ueb/types/report"

export const getReports = async (): Promise<Report[]> => {
    try {
        const res = await fetch("/api/report")
        if (!res.ok) {
            console.error("No se pudieron cargar los reportes")
            return []
        }
        const data = await res.json()
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error("Error en getReports:", error)
        return []
    }
}

export const createReport = async (reportData: CreateReportDto): Promise<Report | null> => {
    try {
        const res = await fetch("/api/report", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(reportData),
        })

        if (!res.ok) {
            console.error("No se pudo crear el reporte")
            return null
        }

        const data = await res.json()
        return data || null
    } catch (error) {
        console.error("Error en createReport:", error)
        return null
    }
}
