import "dotenv/config"
import express from "express"
import cors from "cors"
import routes from "./routes/index.js"

const app = express()

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
        preflightContinue: false,
    })
)

app.use(express.json())

app.use("/api/v1", routes)
app.use("/get", (_, res) => {
    res.json({ message: "GET request received" })
})

const port = process.env.PORT ?? 4000

app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`)
})

export default app
