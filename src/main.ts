import cors from "cors"
import express from "express"
import { PORT } from "./constants"
import { answerRoute } from "./routes/answer"
import { healthRoute } from "./routes/health"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: "*" }))

app.get("/health", healthRoute)
app.post("/answer", answerRoute)

app.listen(PORT, () => {
	console.log(`🚀 Server running on port http://localhost:${PORT}`)
})

// import { createInterface } from "readline/promises"
// import { resolveQuery } from "./core/query"

// const readline = createInterface({
// 	input: process.stdin,
// 	output: process.stdout,
// })

// async function main() {
// 	const query = await readline.question("Enter your query: ")
// 	const { answer, diagram } = await resolveQuery(query)
// 	console.log("ANSWER:", answer)
// 	if (diagram) console.log("DIAGRAM:", diagram)
// }

// main()
