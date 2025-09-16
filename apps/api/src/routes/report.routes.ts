import { Router } from "express"
import { getReportsController, createReportController } from "../controllers/report.controller.js"

const router = Router()

router.get("/", getReportsController)
router.post("/", createReportController)

export default router
