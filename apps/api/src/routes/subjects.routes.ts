import { Router } from "express"
import {
    createSubjectController,
    deleteSubjectController,
    getSubjectsByProfessorIdController,
    getSubjectsController,
    addAssignmentController,
    getProfessorsBySubjectController,
    deleteAssignmentController,
    updateSubjectController,
    getProfessorsBySemesterController,
} from "../controllers/subject.controller.js"

const router = Router()

router.get("/", getSubjectsController)
router.post("/", createSubjectController)
router.put("/:id", updateSubjectController)
router.delete("/:id", deleteSubjectController)

// Get professors by semester - MUST be before /:id/professors to avoid route conflict
router.get("/semester/:semester/professors", getProfessorsBySemesterController)

// This route must come after /semester/:semester/professors
router.get("/:id/professors", getSubjectsByProfessorIdController)

router.post("/assignments", addAssignmentController)
router.get("/:subjectId/assignments", getProfessorsBySubjectController)
router.delete("/assignments/:assignmentId", deleteAssignmentController)

export default router
