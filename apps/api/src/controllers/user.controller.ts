import { Request, Response } from "express"
import { createUser, deleteUser, getUserById, getUsers, updateUserPassword } from "../services/users.service.js"

export const getUsersController = async (req: Request, res: Response) => {
    try {
        const byRole = req.query.role as string
        const users = await getUsers()
        const filteredUsers = byRole ? users.filter((user) => user.role === byRole) : users
        res.status(200).json({
            data: filteredUsers,
            errors: null,
            message: "Users retrieved successfully",
        })
    } catch {
        res.status(500).json({
            data: null,
            errors: ["Failed to retrieve users"],
            message: "Internal server error",
        })
    }
}

export const getUserByIdController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id
        if (!id) {
            return res.status(400).json({
                data: null,
                errors: ["User ID is required"],
                message: "User ID is required",
            })
        }
        const user = await getUserById(id)
        if (!user) {
            return res.status(404).json({
                data: null,
                errors: ["User not found"],
                message: "User not found",
            })
        }
        res.status(200).json({
            data: user,
            errors: null,
            message: "User retrieved successfully",
        })
    } catch {
        res.status(500).json({
            data: null,
            errors: ["Failed to retrieve user"],
            message: "Internal server error",
        })
    }
}

export const createUserController = async (req: Request, res: Response) => {
    try {
        const user = await createUser(req.body)
        res.status(201).json({
            data: user,
            errors: null,
            message: "User created successfully",
        })
    } catch {
        res.status(500).json({
            data: null,
            errors: ["Failed to create user"],
            message: "Internal server error",
        })
    }
}

export const updatePasswordController = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(400).json({
                data: null,
                errors: ["User ID is required"],
                message: "User ID is required",
            })
        }
        const { newPassword } = req.body
        const updatedUser = await updateUserPassword(userId, newPassword)
        if (!updatedUser) {
            return res.status(404).json({
                data: null,
                errors: ["User not found"],
                message: "User not found",
            })
        }
        res.status(200).json({
            data: updatedUser,
            errors: null,
            message: "Password updated successfully",
        })
    } catch {
        res.status(500).json({
            data: null,
            errors: ["Failed to update password"],
            message: "Internal server error",
        })
    }
}

export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(400).json({
                data: null,
                errors: ["User ID is required"],
                message: "User ID is required",
            })
        }
        const deletedUser = await deleteUser(userId)
        if (!deletedUser) {
            return res.status(404).json({
                data: null,
                errors: ["User not found"],
                message: "User not found",
            })
        }
        res.status(200).json({
            data: deletedUser,
            errors: null,
            message: "User deleted successfully",
        })
    } catch {
        res.status(500).json({
            data: null,
            errors: ["Failed to delete user"],
            message: "Internal server error",
        })
    }
}
