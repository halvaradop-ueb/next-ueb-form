import { Report, CreateReportDto } from "@ueb/types/report"
import { createService, createRequest } from "./utils"

export const getReports = async (): Promise<Report[]> => {
    // In production, use Next.js API routes
    if (process.env.NODE_ENV === "production") {
        try {
            const response = await fetch("/api/reports")
            if (!response.ok) {
                throw new Error(`Error fetching reports: ${response.statusText}`)
            }
            const json = await response.json()
            return json.data || []
        } catch (error) {
            console.error("Error en getReports:", error)
            return []
        }
    }

    // In development, use the Express API
    try {
        const request = createRequest("GET", "report")
        return createService(request) || []
    } catch (error) {
        console.error("Error en getReports:", error)
        return []
    }
}

export const createReport = async (reportData: CreateReportDto): Promise<Report | null> => {
    try {
        const request = createRequest("POST", "report", reportData)
        return createService(request)
    } catch (error) {
        console.error("Error en createReport:", error)
        return null
    }
}
