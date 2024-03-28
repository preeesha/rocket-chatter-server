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
import { __suggestFix__ } from "./routes/suggestFix"

async function main() {
	const query = `
	function processOrder(
		items: Item[],
		orderQuantities: Record<number, number>
	): Item[] {
		const updatedItems = items.map((item) => {
			const orderQuantity = orderQuantities[item.id] || 0

			// Only process if there's an order for this item
			if (orderQuantity > 0) {
				try {
					return updateStockLevel(item, -orderQuantity) // Remove from stock
				} catch (error) {
					// You might want more complex error handling, like partial orders
					return item // Return original item if there's an error
				}
			} else {
				return item
			}
		})

		return updatedItems
	}
	`
	const res = await __suggestFix__("processOrder", "it's not working")
	writeJSON("response", res)

	console.log("DONE 🚀")
	console.log(res)

	closeDBConnection()
}

main()
