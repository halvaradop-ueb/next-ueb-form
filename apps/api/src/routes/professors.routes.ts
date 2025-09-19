import { Router } from "express"
import {
    addPeerReviewController,
    getPeerReviewsController,
    getPeerReviewByIdController,
    updatePeerReviewController,
    deletePeerReviewController,
} from "../controllers/professor.controller.js"

const router = Router()

router.get("/:id/co_evaluation", getPeerReviewsController)
router.post("/:id/co_evaluation", addPeerReviewController)

router.get("/:id/co_evaluation/:reviewId", getPeerReviewByIdController)
router.post("/:id/co_evaluation/:reviewId", updatePeerReviewController)
router.delete("/:id/co_evaluation/:reviewId", deletePeerReviewController)

export default router
