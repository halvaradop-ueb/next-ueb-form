import { Request, Response } from "express"
import {
    addSubject,
    deleteSubject,
    getSubjects,
    getSubjectsByProfessorId,
    addAssignment,
    getProfessorsBySubject,
    deleteAssignment,
    updateSubject,
} from "../services/subjects.service.js"
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

export const updateSubjectController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const subjectId = req.params.id
        if (!subjectId) {
            return res.status(400).json(errorResponse("Subject ID is required"))
        }
        const updates = req.body
        const updatedSubject = await updateSubject(subjectId, updates)
        res.json({
            data: updatedSubject,
            errors: null,
            message: "Subject updated successfully",
        })
    } catch (error) {
        console.error("Error updating subject:", error)
        res.status(500).json(errorResponse("Failed to update subject"))
    }
}

export const deleteSubjectController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const subjectId = req.params.id
        if (!subjectId) {
            return res.status(400).json(errorResponse("Subject ID is required"))
        }
        const success = await deleteSubject(subjectId)
        if (success) {
            res.json({
                data: {},
                errors: null,
                message: "Subject deleted successfully",
            })
        } else {
            res.status(404).json(errorResponse("Subject not found"))
        }
    } catch (error) {
        console.error("Error deleting subject:", error)
        res.status(500).json(errorResponse("Failed to delete subject"))
    }
}

export const addAssignmentController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const { professorId, subjectId } = req.body
        if (!professorId || !subjectId) {
            return res.status(400).json(errorResponse("Professor ID and Subject ID are required"))
        }
        const assignment = await addAssignment(professorId, subjectId)
        res.status(201).json({
            data: assignment,
            errors: null,
            message: "Assignment created successfully",
        })
    } catch (error) {
        console.error("Error creating assignment:", error)
        res.status(500).json(errorResponse("Failed to create assignment"))
    }
}

export const getProfessorsBySubjectController = async (req: Request, res: Response<APIResponse>) => {
    try {
        const subjectId = req.params.subjectId
        if (!subjectId) {
            return res.status(400).json(errorResponse("Subject ID is required"))
        }
        const assignments = await getProfessorsBySubject(subjectId)
        res.json({
            data: assignments,
            errors: null,
            message: "Professors retrieved successfully",
        })
    } catch (error) {
        console.error("Error fetching professors by subject:", error)
        res.status(500).json(errorResponse("Failed to retrieve professors"))
    }
}

export const deleteAssignmentController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const assignmentId = req.params.assignmentId
        if (!assignmentId) {
            return res.status(400).json(errorResponse("Assignment ID is required"))
        }
        const success = await deleteAssignment(assignmentId)
        if (success) {
            res.json({
                data: {},
                errors: null,
                message: "Assignment deleted successfully",
            })
        } else {
            res.status(404).json(errorResponse("Assignment not found"))
        }
    } catch (error) {
        console.error("Error deleting assignment:", error)
        res.status(500).json(errorResponse("Failed to delete assignment"))
    }
}
