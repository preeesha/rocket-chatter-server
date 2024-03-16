import { Node, ts } from "ts-morph"

import { ingestData } from "./data"
import { DBNode, makeDBNode } from "./node"
import { processCodebase } from "./project"

let records: Record<string, DBNode[]> = {}

async function ingest() {
	const DIR = [
		//
		"./project",
		"/mnt/Ren/@Codebase/bedrock/src",
		"/mnt/Ren/@Codebase/bedrock/src/Components/Common/UI/",
		"/home/yogesh/Desktop/Rocket.Chat",
	]
	await processCodebase(`${DIR.at(-1)!}/**/*.{ts,tsx}`, makeNode)
	await ingestData(records)

	console.log("Ingested")
}

async function makeNode(node: Node<ts.Node>) {
	const n = makeDBNode(node)
	if (!records[n.filePath]) {
		records[n.filePath] = []
	}
	records[n.filePath].push(n)

	for (const local of node.getLocals()) {
		const ln = makeDBNode(local.getDeclarations()[0])
		n.children.push(ln)
	}

	if (node.getKind() === ts.SyntaxKind.ClassDeclaration) {
	}
}

async function main() {
	return await ingest()

	// await insertDataIntoDB(JSON.parse(readFileSync("data.json", "utf-8"))).then(
	// 	() => closeDBConnection()
	// )
}

main()
