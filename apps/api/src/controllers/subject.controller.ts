import { Request, Response } from "express"
import { addSubject, deleteSubject, getSubjects, getSubjectsByProfessorId } from "../services/subjects.service.js"

export const getSubjectsController = async (_: Request, res: Response) => {
    try {
        const subjects = await getSubjects()
        res.json(subjects)
    } catch (error) {
        console.error("Error fetching subjects:", error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}

export const getSubjectsByProfessorIdController = async (req: Request, res: Response) => {
    try {
        const professorId = req.params.id
        if (!professorId) {
            return res.status(400).json({ error: "Professor ID is required" })
        }
        const subjects = await getSubjectsByProfessorId(professorId)
        res.json(subjects)
    } catch (error) {
        console.error("Error fetching subjects by professor ID:", error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}

export const createSubjectController = async (req: Request, res: Response) => {
    try {
        const subject = req.body
        const newSubject = await addSubject(subject)
        res.status(201).json(newSubject)
    } catch (error) {
        console.error("Error creating subject:", error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}

export const deleteSubjectController = async (req: Request, res: Response) => {
    try {
        const subjectId = req.params.id
        if (!subjectId) {
            return res.status(400).json({ error: "Subject ID is required" })
        }
        const success = await deleteSubject(subjectId)
        if (success) {
            res.status(204).send()
        } else {
            res.status(404).json({ error: "Subject not found" })
        }
    } catch (error) {
        console.error("Error deleting subject:", error)
        res.status(500).json({ error: "Internal Server Error" })
    }
}
