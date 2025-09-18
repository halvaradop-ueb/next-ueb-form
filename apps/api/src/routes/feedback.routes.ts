import { Router } from "express"
import { getFeedback, addFeedback } from "../services/feedback.service.js"

const router = Router()

router.get("/", async (req, res) => {
    const professorId = req.query.professorId as string
    const subjectId = req.query.subjectId as string

    if (!professorId || !subjectId) {
        return res.status(400).json({ error: "Missing professorId or subjectId" })
    }

    try {
        const feedback = await getFeedback(professorId, subjectId)
        return res.json(feedback)
    } catch (error) {
        console.error("Error fetching feedback:", error)
        return res.status(500).json({ error: "Failed to fetch feedback" })
    }
})

router.post("/", async (req, res) => {
    const { studentId, subject, professor, comment, rating } = req.body

    if (!studentId || !subject || !professor || rating == null) {
        return res.status(400).json({ error: "Missing required fields" })
    }

    try {
        const newFeedback = await addFeedback({ subject, professor, comment, rating }, studentId)
        return res.json(newFeedback)
    } catch (error) {
        console.error("Error adding feedback:", error)
        return res.status(500).json({ error: "Failed to add feedback" })
    }
})

export default router
