import { Router } from "express"
import {
    getAutoEvaluationByProfessorAndSubject,
    getAutoEvaluationByProfessor,
    addAutoEvaluationAnswer,
    verifyAutoEvaluationController,
} from "../controllers/auto-evaluation.controller.js"

const router = Router()

/**
 * @route GET /api/auto-evaluation
 * @desc Get autoevaluation answers for a specific professor and subject
 * @access Public
 */
router.get("/", getAutoEvaluationByProfessorAndSubject)

/**
 * @route GET /api/auto-evaluation/verify
 * @desc Verify if an auto-evaluation exists for a professor and subject
 * @access Public
 */
router.get("/verify", verifyAutoEvaluationController)

/**
 * @route GET /api/auto-evaluation/professor/:professorId
 * @desc Get autoevaluation answers for a specific professor
 * @access Public
 */
router.get("/professor/:professorId", getAutoEvaluationByProfessor)

/**
 * @route POST /api/auto-evaluation
 * @desc Submit autoevaluation answers
 * @access Public
 */
router.post("/", addAutoEvaluationAnswer)

export default router
