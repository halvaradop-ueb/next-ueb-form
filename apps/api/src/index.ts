import "dotenv/config"
import express from "express"
import cors from "cors"
import routes from "./routes/index.js"

const app = express()

app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? process.env.FRONTEND_URL || "https://your-app.vercel.app"
                : "http://localhost:3000",
        credentials: true,
    })
)
app.use(express.json())

app.use("/api/v1", routes)

const port = process.env.PORT ?? 4000

app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`)
})

export default app
