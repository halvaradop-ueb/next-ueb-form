import { Request, Response } from "express"
import { getReports, createReport } from "../services/report.service.js"
import { errorResponse } from "../lib/utils.js"
import { APIResponse } from "../lib/types.js"
import { Report, CreateReportDto } from "@ueb/types/report"

export const getReportsController = async (req: Request, res: Response<APIResponse<Report[]>>) => {
    try {
        const reports: Report[] = await getReports()
        return res.status(200).json({
            data: reports,
            errors: null,
            message: "Reports retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching reports:", error)
        return res.status(500).json(errorResponse<Report[]>("Failed to fetch reports"))
    }
}

export const createReportController = async (req: Request, res: Response<APIResponse<Report>>) => {
    try {
        const body: CreateReportDto = req.body

        if (!body.title || !body.professor_id || !body.subject_id) {
            return res.status(400).json({
                data: null,
                errors: ["Missing required fields: title, professor_id or subject_id"],
                message: "Missing required fields: title, professor_id or subject_id",
            })
        }

        const newReport = await createReport(body)
        if (!newReport) {
            return res.status(500).json({
                data: null,
                errors: ["Failed to create report"],
                message: "Failed to create report",
            })
        }

        return res.status(200).json({
            data: newReport,
            errors: null,
            message: "Report created successfully",
        })
    } catch (error) {
        console.error("Error creating report:", error)
        return res.status(500).json(errorResponse<Report>("Internal server error"))
    }
}
