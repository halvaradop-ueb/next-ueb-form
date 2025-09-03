import { Router } from "express"
import { authenticate, checkAndRegisterUser, SafeUser } from "../services/auth.service.js"

const router = Router()

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: "Missing email or password" })
        }

        const user: SafeUser | null = await authenticate(email, password)
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        return res.json(user)
    } catch (error) {
        console.error("Error in login:", error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.post("/register", async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ error: "Missing email" })
        }

        const user: SafeUser | null = await checkAndRegisterUser({ email })
        if (!user) {
            return res.status(500).json({ error: "Failed to register user" })
        }

        return res.json(user)
    } catch (error) {
        console.error("Error in register:", error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

export default router
