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
import { writeJSON } from "./core/utils"
import { __searchUsage__ } from "./routes/searchUsage"

async function main() {
	const query = "bFunction"
	const res = await __searchUsage__(query)
	writeJSON("response", res)

	console.log("DONE 🚀")
	console.log(res.answer)
	console.log(res.impact)
	console.log(res.diagram)

	closeDBConnection()
}

main()
