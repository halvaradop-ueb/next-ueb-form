import { Router } from "express"
import {
    createSubjectController,
    deleteSubjectController,
    getSubjectsByProfessorIdController,
    getSubjectsController,
} from "../controllers/subject.controller.js"

const router = Router()

router.get("/", getSubjectsController)
router.post("/", createSubjectController)

router.delete("/:id", deleteSubjectController)
router.get("/:id/professors", getSubjectsByProfessorIdController)

export default router
