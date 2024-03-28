// import cors from "cors"
// import express from "express"
// import { PORT } from "./constants"
// import { documentRoute } from "./routes/document"
// import { healthRoute } from "./routes/health"
// import { searchUsageRoute } from "./routes/searchUsage"
// import { summarizeRoute } from "./routes/summarize"
// import { translateRoute } from "./routes/translate"

// const app = express()
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))
// app.use(cors({ origin: "*" }))

// app.get("/health", healthRoute)
// app.post("/summarize", summarizeRoute)
// app.post("/searchUsage", searchUsageRoute)
// app.post("/document", documentRoute)
// app.post("/translate", translateRoute)

// app.listen(PORT, () => {
// 	console.log(`🚀 Server running on port http://localhost:${PORT}`)
// })

import { closeDBConnection } from "./core/neo4j"
import { writeJSON } from "./core/utils"
import { __styleguide__ } from "./routes/styleguide"

async function main() {
	const query = `
	async function __styleguide__() {
		const user = useUSer()
		const styleguide = useStyleguides()
		return {
			"status": "SUCCESS",
			"message": "Styleguide generated successfully"
		}
	}
	`
	const res = await __styleguide__(query)
	writeJSON("response", res)

	console.log("DONE 🚀")
	console.log(res)

	closeDBConnection()
}

main()
