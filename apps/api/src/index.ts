import "dotenv/config"
import express from "express"
import routes from "./routes/index.js"

const app = express()

app.use(express.json())

app.use("/api/v1", routes)

const port = process.env.PORT ?? 4000

app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`)
})

export default app
