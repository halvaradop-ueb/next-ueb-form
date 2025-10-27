import { Request, Response } from "express"
import { authenticate, checkAndRegisterUser, SafeUser } from "../services/auth.service.js"
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

export const registerController = async (req: Request, res: Response<APIResponse<SafeUser>>) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                data: null,
                errors: ["Missing email"],
                message: "Missing email",
            })
        }

        const user: SafeUser | null = await checkAndRegisterUser({ email })
        if (!user) {
            return res.status(500).json({
                data: null,
                errors: ["Failed to register user"],
                message: "Failed to register user",
            })
        }

        return res.status(200).json({
            data: user,
            errors: null,
            message: "Registration successful",
        })
    } catch (error) {
        console.error("Error in register:", error)
        return res.status(500).json(errorResponse<SafeUser>("Internal server error"))
    }
}

export const outlookController = async (req: Request, res: Response<APIResponse<SafeUser>>) => {
    try {
        const { access_token } = req.body

        if (!access_token) {
            return res.status(400).json({
                data: null,
                errors: ["Missing access_token"],
                message: "Missing access_token",
            })
        }

        // Get user info from Microsoft
        const userInfoResponse = await fetch("https://graph.microsoft.com/oidc/userinfo", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })

        if (!userInfoResponse.ok) {
            return res.status(400).json({
                data: null,
                errors: ["Invalid access_token"],
                message: "Invalid access_token",
            })
        }

        const userInfo = await userInfoResponse.json()

        // Register or get user
        const user = await checkAndRegisterUser({ email: userInfo.email })

        if (!user) {
            return res.status(500).json({
                data: null,
                errors: ["Failed to register user"],
                message: "Failed to register user",
            })
        }

        return res.status(200).json({
            data: user,
            errors: null,
            message: "Outlook authentication successful",
        })
    } catch (error) {
        console.error("Error in outlook auth:", error)
        return res.status(500).json(errorResponse<SafeUser>("Internal server error"))
    }
}
