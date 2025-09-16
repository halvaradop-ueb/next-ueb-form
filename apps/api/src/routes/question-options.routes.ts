import { Router } from "express"
import { getQuestionOptions, addQuestionOptions, deleteQuestionOptions } from "../services/question-options.service.js"

const router = Router()

router.get("/", async (req, res) => {
    const questionId = req.query.questionId as string
    if (!questionId) return res.status(400).json({ error: "Missing questionId" })

    try {
        const options = await getQuestionOptions(questionId)
        return res.json(options)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post("/", async (req, res) => {
    const questionId = req.query.questionId as string
    if (!questionId) return res.status(400).json({ error: "Missing questionId" })

    const newOptions = req.body.options
    if (!Array.isArray(newOptions)) {
        return res.status(400).json({ error: "Options must be an array of strings" })
    }

    try {
        const added = await addQuestionOptions(questionId, newOptions)
        return res.status(added ? 200 : 500).json({ success: added })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.delete("/", async (req, res) => {
    const questionId = req.query.questionId as string
    if (!questionId) return res.status(400).json({ error: "Missing questionId" })

    try {
        const deleted = await deleteQuestionOptions(questionId)
        return res.status(deleted ? 200 : 500).json({ success: deleted })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

export default router
