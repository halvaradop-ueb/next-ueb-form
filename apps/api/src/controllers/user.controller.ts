import { Request, Response } from "express"
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser,
    updateUserPassword,
} from "../services/users.service.js"
import { errorResponse } from "../lib/utils.js"
import { APIResponse } from "../lib/types.js"

/**
 * TODO: improve filtering
 */
export const getUsersController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const byRole = req.query.role
        const users = await getUsers()
        let filteredUsers = users
        if (byRole !== undefined) {
            const roles = Array.isArray(byRole) ? byRole : [byRole]
            filteredUsers = users.filter((user) => roles.includes(user.role))
        }
        res.status(200).json({
            data: filteredUsers,
            errors: null,
            message: "Users retrieved successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to retrieve users"))
    }
}

export const updateUserController = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(400).json({
                data: null,
                errors: ["User ID is required"],
                message: "User ID is required",
            })
        }
        const updatedUser = await updateUser({ ...req.body, id: userId })
        if (!updatedUser) {
            return res.status(404).json(errorResponse("User not found"))
        }
        res.status(200).json({
            data: updatedUser,
            errors: null,
            message: "User updated successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to update user"))
    }
}

export const getUserByIdController = async (req: Request, res: Response<APIResponse<{}>>) => {
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
            return res.status(404).json(errorResponse("User not found"))
        }
        res.status(200).json({
            data: user,
            errors: null,
            message: "User retrieved successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to retrieve user"))
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
        res.status(500).json(errorResponse("Failed to create user"))
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
            return res.status(404).json(errorResponse("User not found"))
        }
        res.status(200).json({
            data: updatedUser,
            errors: null,
            message: "Password updated successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to update password"))
    }
}

export const deleteUserController = async (req: Request, res: Response<APIResponse<{}>>) => {
    try {
        const userId = req.params.id
        if (!userId) {
            return res.status(400).json(errorResponse("User ID is required"))
        }
        const deletedUser = await deleteUser(userId)
        if (!deletedUser) {
            return res.status(404).json(errorResponse("User not found"))
        }
        res.status(200).json({
            data: deletedUser,
            errors: null,
            message: "User deleted successfully",
        })
    } catch {
        res.status(500).json(errorResponse("Failed to delete user"))
    }
}
