import { Request, Response } from "express"
import { authenticate, SafeUser } from "../services/auth.service.js"
import { errorResponse } from "../lib/utils.js"
import { APIResponse } from "../lib/types.js"

export const loginController = async (req: Request, res: Response<APIResponse<SafeUser>>) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                data: null,
                errors: ["Missing email or password"],
                message: "Missing email or password",
            })
        }

        const user: SafeUser | null = await authenticate(email, password)
        if (!user) {
            return res.status(401).json({
                data: null,
                errors: ["Invalid credentials"],
                message: "Invalid credentials",
            })
        }

        return res.status(200).json({
            data: user,
            errors: null,
            message: "Login successful",
        })
    } catch (error) {
        console.error("Error in login:", error)
        return res.status(500).json(errorResponse<SafeUser>("Internal server error"))
    }
}
