import { Router } from "express"
import {
    getQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    getQuestionsForStudents,
    getQuestionsForProfessors,
} from "../services/questions.service.js"

const router = Router()

router.get("/", async (req, res) => {
    try {
        const audience = req.query.audience as string

        if (audience === "student") {
            const [questions, grouped] = await getQuestionsForStudents()
            return res.json({ questions, grouped })
        }

        if (audience === "professor") {
            const [questions, grouped] = await getQuestionsForProfessors()
            return res.json({ questions, grouped })
        }

        const questions = await getQuestions()
        return res.json({ questions })
    } catch (error) {
        console.error("Error fetching questions:", error)
        return res.status(500).json({ error: "Failed to fetch questions" })
    }
})

router.post("/", async (req, res) => {
    try {
        const body = req.body
        const newQuestion = await addQuestion(body)
        if (!newQuestion) {
            return res.status(500).json({ error: "Failed to add question" })
        }
        return res.json(newQuestion)
    } catch (error) {
        console.error("Error adding question:", error)
        return res.status(500).json({ error: "Failed to add question" })
    }
})

router.put("/", async (req, res) => {
    try {
        const body = req.body
        const updatedQuestion = await updateQuestion(body)
        return res.json(updatedQuestion)
    } catch (error) {
        console.error("Error updating question:", error)
        return res.status(500).json({ error: "Failed to update question" })
    }
})

router.delete("/", async (req, res) => {
    try {
        const id = req.query.id as string
        if (!id) return res.status(400).json({ error: "Missing question id" })

        const result = await deleteQuestion(id)
        return res.json({ success: result })
    } catch (error) {
        console.error("Error deleting question:", error)
        return res.status(500).json({ error: "Failed to delete question" })
    }
})

export default router
