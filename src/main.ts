import cors from "cors"
import express from "express"
import { PORT } from "./constants"

import { askRoute } from "./routes/ask"
import { diagramRoute } from "./routes/diagram"
import { documentRoute } from "./routes/document"
import { findSimilarRoute } from "./routes/findSimilar"
import { healthRoute } from "./routes/health"
import { importanceRoute } from "./routes/importance"
import { refactorRoute } from "./routes/refactor"
import { searchUsageRoute } from "./routes/searchUsage"
import { styleguideRoute } from "./routes/styleguide"
import { suggestFixRoute } from "./routes/suggestFix"
import { testCoverageRoute } from "./routes/testCoverage"
import { translateRoute } from "./routes/translate"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: "*" }))

app.get("/health", healthRoute)

app.post("/ask", askRoute)
app.post("/diagram", diagramRoute)
app.post("/document", documentRoute)
app.post("/findSimilar", findSimilarRoute)
app.post("/importance", importanceRoute)
app.post("/refactor", refactorRoute) //
app.post("/searchUsage", searchUsageRoute)
app.post("/styleguide", styleguideRoute) //
app.post("/suggestFix", suggestFixRoute)
app.post("/testCoverage", testCoverageRoute)
app.post("/translate", translateRoute)

app.listen(PORT, () => {
	console.clear()
	console.log(`🚀 Server running on port http://localhost:${PORT}`)
})

