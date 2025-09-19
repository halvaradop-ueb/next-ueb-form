import { Router } from "express"
import { createSubjectController, deleteSubjectController, getSubjectsController } from "../controllers/subject.controller.js"

const router = Router()

router.get("/", getSubjectsController)
router.post("/", createSubjectController)

router.delete("/:id", deleteSubjectController)

export default router
