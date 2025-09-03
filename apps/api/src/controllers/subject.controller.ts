import { Request, Response } from "express"
import { addSubject, deleteSubject, getSubjects, getSubjectsByProfessorId } from "../services/subjects.service.js"
import { APIResponse } from "../lib/types.js"
import { errorResponse } from "../lib/utils.js"

export const getSubjectsController = async (_: Request, res: Response<APIResponse>) => {
    try {
        const subjects = await getSubjects()
        res.json({
            data: subjects,
            errors: null,
            message: "Subjects retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching subjects:", error)
        res.status(500).json(errorResponse("Failed to retrieve subjects"))
    }
}

export const getSubjectsByProfessorIdController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const professorId = req.params.id
        if (!professorId) {
            return res.status(400).json(errorResponse("Professor ID is required"))
        }
        const subjects = await getSubjectsByProfessorId(professorId)
        res.json({
            data: subjects,
            errors: null,
            message: "Subjects retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching subjects by professor ID:", error)
        res.status(500).json(errorResponse("Failed to retrieve subjects"))
    }
}

export const createSubjectController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const subject = req.body
        const newSubject = await addSubject(subject)
        res.status(201).json({
            data: newSubject,
            errors: null,
            message: "Subject created successfully",
        })
    } catch (error) {
        console.error("Error creating subject:", error)
        res.status(500).json(errorResponse("Failed to create subject"))
    }
}

export const deleteSubjectController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const subjectId = req.params.id
        if (!subjectId) {
            return res.status(400).json(errorResponse("Subject ID is required"))
        }
        const success = await deleteSubject(subjectId)
        if (success) {
            res.status(204).send()
        } else {
            res.status(404).json(errorResponse("Subject not found"))
        }
    } catch (error) {
        console.error("Error deleting subject:", error)
        res.status(500).json(errorResponse("Failed to delete subject"))
    }
}
