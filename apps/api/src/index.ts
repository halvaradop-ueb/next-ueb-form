import "dotenv/config"
import express from "express"
import cors from "cors"
import routes from "./routes/index.js"

const app = express()

const corsOptions = {
    origin: [
        "http://localhost:3000",
        "*"
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}

app.use(cors(corsOptions))

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
