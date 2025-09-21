import { Router } from "express"
import {
    getAutoEvaluationByProfessorAndSubject,
    getAutoEvaluationByProfessor,
} from "../controllers/auto-evaluation.controller.js"

const router = Router()

/**
 * @route GET /api/auto-evaluation
 * @desc Get autoevaluation answers for a specific professor and subject
 * @access Public
 */
router.get("/", getAutoEvaluationByProfessorAndSubject)

/**
 * @route GET /api/auto-evaluation/professor/:professorId
 * @desc Get autoevaluation answers for a specific professor
 * @access Public
 */
router.get("/professor/:professorId", getAutoEvaluationByProfessor)

export default router
