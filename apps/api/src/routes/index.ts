import { Router } from "express"
import userRoutes from "./users.routes.js"
import subjectRoutes from "./subjects.routes.js"
import stageRoutes from "./stages.routes.js"

const router = Router()

router.use("/users", userRoutes)
router.use("/subjects", subjectRoutes)
router.use("/stages", stageRoutes)

export default router
