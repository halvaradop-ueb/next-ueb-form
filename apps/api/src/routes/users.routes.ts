import { Router } from "express"
import multer from "multer"
import {
    createUserController,
    deleteUserController,
    getUserByIdController,
    getUsersController,
    updatePasswordController,
    updateUserController,
    uploadUserPhotoController,
} from "../controllers/user.controller.js"

const router = Router()

const upload = multer()

router.get("/", getUsersController)
router.post("/", createUserController)

router.get("/:id", getUserByIdController)
router.put("/:id", updateUserController)
router.delete("/:id", deleteUserController)
router.put("/:id/password", updatePasswordController)

router.post("/:id/photo", upload.single("photo") as any, uploadUserPhotoController)

export default router
