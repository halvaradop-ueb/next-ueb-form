import { Router } from "express"
import { loginController, registerController, outlookController } from "../controllers/auth.controller.js"

const router = Router()

router.post("/login", loginController)
router.post("/register", registerController)
router.post("/outlook", outlookController)

export default router
