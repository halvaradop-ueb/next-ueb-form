import { Request, Response } from "express"
import { APIResponse } from "../lib/types.js"
import { errorResponse } from "../lib/utils.js"
import {
    getAnswers,
    getAnswerById,
    getAnswersByUser,
    getAnswersByQuestion,
    addAnswer,
} from "../services/answer.service.js"

export const getAnswersController = async (_: Request, res: Response<APIResponse>) => {
    try {
        const answers = await getAnswers()
        res.status(200).json({
            data: answers,
            errors: null,
            message: "Answers retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answers:", error)
        res.status(500).json(errorResponse("Failed to retrieve answers"))
    }
}

export const getAnswerByIdController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json(errorResponse("Answer ID is required"))
        }
        const answer = await getAnswerById(id)
        res.status(200).json({
            data: answer,
            errors: null,
            message: "Answer retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answer by ID:", error)
        res.status(500).json(errorResponse("Failed to retrieve answer"))
    }
}

/**
 * @deprecated
 * @unstable
 */
export const getAnswersByUserController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const userId = req.params.userId
        if (!userId) {
            return res.status(400).json(errorResponse("User ID is required"))
        }
        const answers = await getAnswersByUser(userId)
        res.status(200).json({
            data: answers,
            errors: null,
            message: "Answers retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answers by user:", error)
        res.status(500).json(errorResponse("Failed to retrieve answers"))
    }
}

export const getAnswersByQuestionController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const questionId = req.params.questionId
        if (!questionId) {
            return res.status(400).json(errorResponse("Question ID is required"))
        }
        const answers = await getAnswersByQuestion(questionId)
        res.status(200).json({
            data: answers,
            errors: null,
            message: "Answers retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching answers by question:", error)
        res.status(500).json(errorResponse("Failed to retrieve answers"))
    }
}

export const addAnswerController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const { answer, userId } = req.body
        if (!answer || !userId) {
            return res.status(400).json(errorResponse("Answer and user ID are required"))
        }
        const success = await addAnswer(answer, userId)
        if (success) {
            res.status(201).json({
                data: null,
                errors: null,
                message: "Answer added successfully",
            })
        } else {
            res.status(500).json(errorResponse("Failed to add answer"))
        }
    } catch (error) {
        console.error("Error adding answer:", error)
        res.status(500).json(errorResponse("Failed to add answer"))
    }
}
