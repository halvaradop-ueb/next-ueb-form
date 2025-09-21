import { Router } from "express"
import {
    createSubjectController,
    deleteSubjectController,
    getSubjectsByProfessorIdController,
    getSubjectsController,
    addAssignmentController,
    getProfessorsBySubjectController,
    deleteAssignmentController,
} from "../controllers/subject.controller.js"

const router = Router()

router.get("/", getSubjectsController)
router.post("/", createSubjectController)

router.delete("/:id", deleteSubjectController)
router.get("/:id/professors", getSubjectsByProfessorIdController)

router.post("/assignments", addAssignmentController)
router.get("/:subjectId/assignments", getProfessorsBySubjectController)
router.delete("/assignments/:assignmentId", deleteAssignmentController)

export default router
