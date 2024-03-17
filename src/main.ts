import { writeFileSync } from "fs"
import { createInterface } from "readline/promises"
import { closeDBConnection } from "./core/neo4j"

// publishRelease

function writeJSON(file: string, data: any) {
	writeFileSync(`${file}.data.json`, JSON.stringify(data, null, 2))
}

async function main() {
	// await insertDataIntoDB(JSON.parse(readFileSync("nodes.data.json", "utf-8"))).then(
	// 	() => closeDBConnection()
	// )

	const readline = createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	const query = await readline.question("Enter your query: ")
	readline.close()

	console.log(query)

	closeDBConnection()
}

main()
