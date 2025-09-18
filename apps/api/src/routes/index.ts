import { Router } from "express"
import userRoutes from "./users.routes.js"
import subjectRoutes from "./subjects.routes.js"
import stageRoutes from "./stages.routes.js"
import answerRoutes from "./answer.routes.js"
import questionRoutes from "./questions.routes.js"
import questionOptionRoutes from "./question-options.routes.js"

const router = Router()

router.use("/users", userRoutes)
router.use("/subjects", subjectRoutes)
router.use("/stages", stageRoutes)
router.use("/answers", answerRoutes)
router.use("/questions", questionRoutes)
router.use("/question-options", questionOptionRoutes)

export default router
