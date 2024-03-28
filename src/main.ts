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
import { __document__ } from "./routes/document"

async function main() {
	const query = "processOrder"
	const res = await __document__(query)
	writeJSON("response", res)

	console.log("DONE 🚀")
	console.log(res.jsdoc)
	console.log(res.explanation)

	closeDBConnection()
}

main()
