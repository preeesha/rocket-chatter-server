// import cors from "cors"
// import express from "express"
// import { PORT } from "./constants"
// import { healthRoute } from "./routes/health"
// import { importanceRoute } from "./routes/importance"
// import { searchUsageRoute } from "./routes/searchUsage"
// import { summarizeRoute } from "./routes/summarize"

// const app = express()
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))
// app.use(cors({ origin: "*" }))

// app.get("/health", healthRoute)
// app.post("/summarize", summarizeRoute)
// app.post("/searchUsage", searchUsageRoute)
// app.post("/importance", importanceRoute)

// app.listen(PORT, () => {
// 	console.log(`🚀 Server running on port http://localhost:${PORT}`)
// })

import { closeDBConnection } from "./core/neo4j"
import { writeJSON } from "./core/utils"
import { __importance__ } from "./routes/importance"

async function main() {
	const query = "bFunction"
	const res = await __importance__(query)
	writeJSON("response", res)

	console.log("DONE 🚀")
	console.log(res.answer)
	console.log(res.impact)
	console.log(res.diagram)

	closeDBConnection()
}

main()
