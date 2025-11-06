import { Request, Response } from "express"
import { getReports, createReport } from "../services/report.service.js"
import { errorResponse } from "../lib/utils.js"
import { APIResponse } from "../lib/types.js"
import { Report, CreateReportDto } from "@ueb/types/report"

export const getReportsController = async (_req: Request, res: Response<APIResponse<Report[]>>) => {
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

        // Validation
        if (!body.title?.trim()) {
            return res.status(400).json({
                data: null,
                errors: ["El título es requerido"],
                message: "Validation failed: title is required",
            })
        }

        if (!body.professor_id || body.professor_id === "all") {
            return res.status(400).json({
                data: null,
                errors: ["Debe seleccionar un profesor específico"],
                message: "Validation failed: specific professor_id is required",
            })
        }

        if (!body.subject_id || body.subject_id === "all") {
            return res.status(400).json({
                data: null,
                errors: ["Debe seleccionar una materia específica"],
                message: "Validation failed: specific subject_id is required",
            })
        }

        const newReport = await createReport(body)
        if (!newReport) {
            console.error("createReport returned null/undefined")
            return res.status(500).json({
                data: null,
                errors: ["No se pudo crear el reporte en la base de datos"],
                message: "Database operation failed",
            })
        }

        return res.status(201).json({
            data: newReport,
            errors: null,
            message: "Reporte creado exitosamente",
        })
    } catch (error: any) {
        console.error("Error creating report:", error)

        // Handle different types of errors
        if (error.message?.includes("Database error") || error.message?.includes("validation")) {
            return res.status(400).json({
                data: null,
                errors: [error.message],
                message: "Validation or database error",
            })
        }

        return res.status(500).json({
            data: null,
            errors: [`Error interno del servidor: ${error.message || "Unknown error"}`],
            message: "Internal server error",
        })
    }
}
