import { Report, CreateReportDto } from "@ueb/types/report"
import { createService, createRequest } from "./utils"

export const getReports = async (): Promise<Report[]> => {
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
