import { Router } from "express"
import {
    getAnswersController,
    getAnswerByIdController,
    getAnswersByUserController,
    getAnswersByQuestionController,
    addAnswerController,
} from "../controllers/answer.controller.js"

const router = Router()

router.get("/", getAnswersController)
router.get("/:id", getAnswerByIdController)
router.get("/user/:userId", getAnswersByUserController)
router.get("/question/:questionId", getAnswersByQuestionController)
router.post("/", addAnswerController)

export default router
