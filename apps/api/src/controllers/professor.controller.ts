import { Request, Response } from "express"
import { errorResponse } from "../lib/utils.js"
import { APIResponse } from "../lib/types.js"
import {
    getPeerReviews,
    addPeerReview,
    getPeerReviewById,
    updatePeerReview,
    deletePeerReview,
} from "../services/professors.service.js"

export const addPeerReviewController = async (req: Request, res: Response) => {
    try {
        const professorId = req.params.id
        if (!professorId) {
            return res.status(400).json(errorResponse("Professor ID is required"))
        }
        const peerReview = await addPeerReview(req.body)
        return res.json(peerReview)
    } catch {
        res.status(500).json(errorResponse("Failed to add peer review"))
    }
}

export const getPeerReviewsController = async (req: Request, res: Response) => {
    try {
        const professorId = req.params.id
        if (!professorId) {
            return res.status(400).json(errorResponse("Professor ID is required"))
        }
        const peerReviews = await getPeerReviews(professorId)
        res.json(peerReviews)
    } catch {
        res.status(500).json(errorResponse("Failed to get peer reviews"))
    }
}

export const getPeerReviewByIdController = async (req: Request, res: Response) => {
    try {
        const professorId = req.params.id
        const reviewId = req.params.reviewId
        if (!professorId || !reviewId) {
            return res.status(400).json(errorResponse("Professor ID and Review ID are required"))
        }
        const peerReview = await getPeerReviewById(professorId, reviewId)
        if (!peerReview) {
            return res.status(404).json(errorResponse("Peer review not found"))
        }
        res.json(peerReview)
    } catch {
        res.status(500).json(errorResponse("Failed to get peer review"))
    }
}

/**
 * @unstable
 */
export const updatePeerReviewController = async (req: Request, res: Response) => {
    try {
        const professorId = req.params.id
        const reviewId = req.params.reviewId
        if (!professorId || !reviewId) {
            return res.status(400).json(errorResponse("Professor ID and Review ID are required"))
        }
        const updatedPeerReview = await updatePeerReview(reviewId, req.body)
        if (!updatedPeerReview) {
            return res.status(404).json(errorResponse("Peer review not found"))
        }
        res.json(updatedPeerReview)
    } catch {
        res.status(500).json(errorResponse("Failed to update peer review"))
    }
}

export const deletePeerReviewController = async (req: Request, res: Response) => {
    try {
        const professorId = req.params.id
        const reviewId = req.params.reviewId
        if (!professorId || !reviewId) {
            return res.status(400).json(errorResponse("Professor ID and Review ID are required"))
        }
        const deleted = await deletePeerReview(reviewId)
        if (!deleted) {
            return res.status(404).json(errorResponse("Peer review not found"))
        }
        res.json({ success: true })
    } catch {
        res.status(500).json(errorResponse("Failed to delete peer review"))
    }
}
