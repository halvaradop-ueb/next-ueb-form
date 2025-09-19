import { Router } from "express"
import {
    createUserController,
    deleteUserController,
    getUserByIdController,
    getUsersController,
    updatePasswordController,
    updateUserController,
} from "../controllers/user.controller.js"

const router = Router()

router.get("/", getUsersController)
router.post("/", createUserController)

router.get("/:id", getUserByIdController)
router.put("/:id", updateUserController)
router.delete("/:id", deleteUserController)
router.put("/:id/password", updatePasswordController)

//router.post("/:id/photo", upload.single("photo"), uploadUserPhotoController)

export default router
