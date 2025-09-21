import { Report, CreateReportDto } from "@ueb/types/report"
import { createService, createRequest } from "./utils"

export const getReports = async (): Promise<Report[]> => {
    try {
        const request = createRequest("GET", "reports")
        const result = await createService(request)
        return Array.isArray(result) ? result : []
    } catch (error) {
        console.error("Error en getReports:", error)
        return []
    }
}

export const createReport = async (reportData: CreateReportDto): Promise<Report | null> => {
    try {
        const request = createRequest("POST", "reports", reportData)
        const result = await createService(request)
        return result || null
    } catch (error) {
        console.error("Error en createReport:", error)
        return null
    }
}
