import { Router } from "express"
import {
    createStageController,
    deleteStageController,
    getStagesController,
    updateStageController,
} from "../controllers/stage.controller.js"

const router = Router()

router.get("/", getStagesController)
router.post("/", createStageController)

router.put("/:id", updateStageController)
router.delete("/:id", deleteStageController)

export default router
