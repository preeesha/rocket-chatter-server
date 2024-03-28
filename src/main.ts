// import cors from "cors"
// import express from "express"
// import { PORT } from "./constants"
// import { answerRoute } from "./routes/answer"
// import { healthRoute } from "./routes/health"

// const app = express()
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))
// app.use(cors({ origin: "*" }))

// app.get("/health", healthRoute)
// app.post("/answer", answerRoute)

// app.listen(PORT, () => {
// 	console.log(`🚀 Server running on port http://localhost:${PORT}`)
// })

import { closeDBConnection } from "./core/neo4j"
import { __summarize__ } from "./routes/summarize"

async function main() {
	// const query = await readline.question("Enter your query: ")
	const query = "What's DBNode and where it's used? and why?"
	const answer = await __summarize__(query)
	console.log("ANSWER:", answer)

	closeDBConnection()
}

main()
