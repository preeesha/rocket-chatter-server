import { closeDBConnection } from "./core/neo4j"
import { writeJSON } from "./core/utils"
import { __findSimilar__ } from "./routes/findSimilar"

async function main() {
	const query = `
	function a() {
		console.log(s)
		console.log("b", s)
	}
	`
	const res = await __findSimilar__(query)
	writeJSON("response", res)

	console.log("DONE 🚀")
	console.log(res)

	closeDBConnection()
}

main()
