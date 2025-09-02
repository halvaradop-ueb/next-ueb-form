import "dotenv/config"
import express from "express"
import cors from "cors"
import routes from "./routes/index.js"

const app = express()

app.use(cors())
app.use(express.json())

const port = process.env.PORT ?? 4000

app.get("/", (_, res) => {
    res.json({ success: true, message: "Results checked", data: [] })
})

app.use("/api/v1", routes)

app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`)
})
