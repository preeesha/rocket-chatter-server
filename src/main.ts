import { readFileSync } from "fs"
import { closeDBConnection } from "./core/neo4j"
import { insertDataIntoDB } from "./database/node"

async function main() {
	await insertDataIntoDB(
		JSON.parse(readFileSync("ingested.data.json", "utf-8"))
	).then(() => closeDBConnection())
}

main()
