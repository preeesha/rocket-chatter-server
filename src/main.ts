import cors from "cors"
import express from "express"
import { PORT } from "./constants"

import { documentRoute } from "./routes/document"
import { findSimilarRoute } from "./routes/findSimilar"
import { healthRoute } from "./routes/health"
import { importanceRoute } from "./routes/importance"
import { refactorRoute } from "./routes/refactor"
import { searchUsageRoute } from "./routes/searchUsage"
import { styleguideRoute } from "./routes/styleguide"
import { suggestFixRoute } from "./routes/suggestFix"
import { summarizeRoute } from "./routes/summarize"
import { testCoverageRoute } from "./routes/testCoverage"
import { translateRoute } from "./routes/translate"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: "*" }))

app.get("/health", healthRoute)

app.post("/document", documentRoute)
app.post("/findSimilar", findSimilarRoute)
app.post("/importance", importanceRoute)
app.post("/refactor", refactorRoute)
app.post("/searchUsage", searchUsageRoute)
app.post("/styleguide", styleguideRoute)
app.post("/suggestFix", suggestFixRoute)
app.post("/summarize", summarizeRoute)
app.post("/testCoverage", testCoverageRoute)
app.post("/translate", translateRoute)

app.listen(PORT, () => {
	console.log(`🚀 Server running on port http://localhost:${PORT}`)
})

// import { closeDBConnection } from "./core/neo4j"
// import { writeJSON } from "./core/utils"
// import { __findSimilar__ } from "./routes/findSimilar"

// async function main() {
// 	const query = `
// 	function a() {
// 		console.log(s)
// 		console.log("b", s)
// 	}
// 	`
// 	const res = await __findSimilar__(query)
// 	writeJSON("response", res)

// 	console.log("DONE 🚀")
// 	console.log(res)

// 	closeDBConnection()
// }

// main()
