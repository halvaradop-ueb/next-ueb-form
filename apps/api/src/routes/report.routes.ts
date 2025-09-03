import { Router } from "express"
import { getReports, createReport, Report, CreateReportDto } from "../services/report.service.js"

const router = Router()

router.get("/", async (req, res) => {
    try {
        const reports: Report[] = await getReports()
        return res.json(reports)
    } catch (error) {
        console.error("Error fetching reports:", error)
        return res.status(500).json({ error: "Failed to fetch reports" })
    }
})

router.post("/", async (req, res) => {
    try {
        const body: CreateReportDto = req.body

        if (!body.title || !body.professor_id || !body.subject_id) {
            return res.status(400).json({ error: "Missing required fields: title, professor_id or subject_id" })
        }

        const newReport = await createReport(body)
        if (!newReport) {
            return res.status(500).json({ error: "Failed to create report" })
        }

        return res.json(newReport)
    } catch (error) {
        console.error("Error creating report:", error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

export default router
