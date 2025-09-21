import { Router } from "express"
import userRoutes from "./users.routes.js"
import subjectRoutes from "./subjects.routes.js"
import stageRoutes from "./stages.routes.js"
import answerRoutes from "./answer.routes.js"
import questionRoutes from "./questions.routes.js"
import questionOptionRoutes from "./question-options.routes.js"
import feedbackRoutes from "./feedback.routes.js"
import professorsRoutes from "./professors.routes.js"
import coevaluationRoutes from "./coevaluation.routes.js"
import reportRoutes from "./report.routes.js"
import authRoutes from "./auth.routes.js"
import autoEvaluationRoutes from "./auto-evaluation.routes.js"

const router = Router()

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/subjects", subjectRoutes)
router.use("/stages", stageRoutes)
router.use("/answers", answerRoutes)
router.use("/questions", questionRoutes)
router.use("/question-options", questionOptionRoutes)
router.use("/feedback", feedbackRoutes)
router.use("/professors", professorsRoutes)
router.use("/co_evaluations", coevaluationRoutes)
router.use("/reports", reportRoutes)
router.use("/auto-evaluation", autoEvaluationRoutes)

export default router
