import { writeFileSync } from "fs"
import { Node, Project, ts } from "ts-morph"
import { DBNode } from "../database/node.types"
import { generateNodeID, makeDBNode } from "./node"

const nodes: Record<string, DBNode> = {}

function writeJSON(file: string, data: any) {
	writeFileSync(`${file}.data.json`, JSON.stringify(data, null, 2))
}

function findCallerFunction(
	node: Node
): Node<ts.FunctionDeclaration> | undefined {
	const parent = node.getParent()
	if (!parent) {
		return undefined // Reached the top of the file
	}

	if (
		parent.getKind() === ts.SyntaxKind.FunctionDeclaration ||
		parent.getKind() === ts.SyntaxKind.ArrowFunction ||
		parent.getKind() === ts.SyntaxKind.SourceFile
	) {
		return parent as Node<ts.FunctionDeclaration>
	}

	return findCallerFunction(parent)
}

export async function processCodebase(path: string) {
	const project = new Project({ skipAddingFilesFromTsConfig: true })
	project.addSourceFilesAtPaths(path)

	project.getSourceFiles().map((sourceFile) => {
		const fileNode = makeDBNode(sourceFile, true)
		nodes[fileNode.id] = fileNode

		const allNodes = [
			...sourceFile.getFunctions(),
			...sourceFile.getTypeAliases(),
			...sourceFile.getEnums(),
			...sourceFile.getInterfaces(),
			...sourceFile.getClasses(),
			...sourceFile.getNamespaces(),
		]

		allNodes.forEach((node) => {
			const fnNode = makeDBNode(node)
			const fnID = fnNode.id
			nodes[fnID] = fnNode
			nodes[fnID].relations.push({
				relation: "IN_FILE",
				target: fileNode.id,
			})

			// Find call expressions for this function
			node.findReferencesAsNodes().forEach((ref) => {
				const callSite = ref.getFirstAncestorByKind(
					ts.SyntaxKind.CallExpression
				)
				if (!callSite) return

				const caller = findCallerFunction(callSite)
				if (!caller) return

				const callerFnID = generateNodeID(caller!)

				const alreadyRelated = nodes[fnID].relations.some((rel) => {
					return rel.target === callerFnID
				})
				if (alreadyRelated) return

				nodes[fnID].relations.push({
					relation: "CALLED_BY",
					target: callerFnID,
				})
			})
		})
	})
}

async function ingest() {
	console.log("🕒 Ingesting")

	const DIR = [
		//
		"./project",
		"/mnt/Ren/@Codebase/bedrock/src/Components/Common/UI/",
		"/mnt/Ren/@Codebase/bedrock/src/Lib",
		"/mnt/Ren/@Codebase/bedrock/src",
		"/home/yogesh/Desktop/Rocket.Chat",
	]
	await processCodebase(`${DIR.at(-1)!}/**/*.{ts,tsx}`)
	writeJSON("nodes", nodes)

	console.log("✅ Ingested")
}

ingest()
