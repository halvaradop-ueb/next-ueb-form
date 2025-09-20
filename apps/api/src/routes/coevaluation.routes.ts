import { getAllCoEvaluationsController } from "../controllers/coevaluation.controller.js"
import { Router } from "express"

const router = Router()

router.get("/", getAllCoEvaluationsController)

export default router
