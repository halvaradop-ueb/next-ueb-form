import { Router } from "express"
import {
    createUserController,
    deleteUserController,
    getUserByIdController,
    getUsersController,
    updatePasswordController,
} from "../controllers/user.controller.js"

const router = Router()

router.get("/", getUsersController)
router.post("/", createUserController)

router.get("/:id", getUserByIdController)
router.delete("/:id", deleteUserController)
router.put("/:id/password", updatePasswordController)

export default router
