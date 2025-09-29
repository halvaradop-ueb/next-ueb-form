import { Router } from "express"
import {
    getAnswersController,
    getAnswerByIdController,
    getAnswersByUserController,
    getAnswersByQuestionController,
    addAnswerController,
    addStudentEvaluationController,
    getStudentEvaluationsController,
} from "../controllers/answer.controller.js"

const router = Router()

router.get("/", getAnswersController)
router.get("/student-evaluations", getStudentEvaluationsController)
router.get("/:id", getAnswerByIdController)
router.get("/user/:userId", getAnswersByUserController)
router.get("/question/:questionId", getAnswersByQuestionController)
router.post("/", addAnswerController)
router.post("/student-evaluation", addStudentEvaluationController)

export default router
