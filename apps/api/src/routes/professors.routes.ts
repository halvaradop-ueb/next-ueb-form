import { Router } from "express"

const router = Router()

router.get("/")
router.get("/:id/subjects")

export default router
