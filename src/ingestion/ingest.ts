import { writeFileSync } from "fs"
import { Node, ts } from "ts-morph"
import { DBNode } from "../database/node.types"
import { makeDBNode } from "./node"
import { processCodebase } from "./project"

let records: Record<string, DBNode[]> = {}

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

async function ingest() {
	console.log("🕒 Ingesting")

	const DIR = [
		//
		"./project",
		"/mnt/Ren/@Codebase/bedrock/src",
		"/mnt/Ren/@Codebase/bedrock/src/Components/Common/UI/",
		"/home/yogesh/Desktop/Rocket.Chat",
	]
	await processCodebase(`${DIR.at(-1)!}/**/*.{ts,tsx}`, makeNode)

	writeFileSync("data.json", JSON.stringify(records, null, 2))

	console.log("✅ Ingested")
}

ingest()
