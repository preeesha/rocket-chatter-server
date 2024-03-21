import { writeFileSync } from "fs"
import { Node, Project, ts } from "ts-morph"
import { DBNode } from "../database/node.types"
import { generateNodeID, makeDBNode, notFoundKindNames } from "./node"

const nodes: Record<string, DBNode> = {}

function writeJSON(file: string, data: any) {
	writeFileSync(`${file}.data.json`, JSON.stringify(data, null, 2))
}

function moveUpWhileParentFound(
	node: Node,
	allowedParents: ts.SyntaxKind[]
): Node<ts.FunctionDeclaration> | undefined {
	const parent = node.getParent()
	if (!parent) {
		return undefined // Reached the top of the file
	}

	if (allowedParents.includes(parent.getKind())) {
		return parent as Node<ts.FunctionDeclaration>
	}

	return moveUpWhileParentFound(parent, allowedParents)
}

const kindNames = new Set<string>()
const unhandledRefKinds = new Set<string>()

export async function processCodebase(path: string) {
	const project = new Project({ skipAddingFilesFromTsConfig: true })
	project.addSourceFilesAtPaths(path)

	await Promise.all(
		project.getSourceFiles().map(async (sourceFile) => {
			const fileNode = await makeDBNode(sourceFile, true)
			nodes[fileNode.id] = fileNode

			const allNodes = [
				...sourceFile.getFunctions(),
				...sourceFile.getTypeAliases(),
				...sourceFile.getEnums(),
				...sourceFile.getInterfaces(),
				...sourceFile.getClasses(),
				...sourceFile.getNamespaces(),
			]

			await Promise.all(
				allNodes.map(async (node) => {
					const fnNode = await makeDBNode(node)
					const fnID = fnNode.id
					nodes[fnID] = fnNode
					nodes[fnID].relations.push({
						relation: "IN_FILE",
						target: fileNode.id,
					})

					// Find call expressions for this function
					node.findReferencesAsNodes().forEach((ref) => {
						kindNames.add(ref.getKindName())
						switch (ref.getKind()) {
							case ts.SyntaxKind.ArrowFunction:
							case ts.SyntaxKind.FunctionDeclaration:
							case ts.SyntaxKind.FunctionExpression: {
								const nodeLocation = ref.getFirstAncestorByKind(
									ts.SyntaxKind.CallExpression
								)
								if (!nodeLocation) return

								const parent = moveUpWhileParentFound(nodeLocation, [
									ts.SyntaxKind.FunctionDeclaration,
									ts.SyntaxKind.ArrowFunction,
									ts.SyntaxKind.SourceFile,
								])
								if (!parent) return

								const parentID = generateNodeID(parent!)

								const isAlreadyRelated = nodes[fnID].relations.some((rel) => {
									return rel.target === parentID
								})
								if (isAlreadyRelated) return

								nodes[fnID].relations.push({
									relation: "CALLED_BY",
									target: parentID,
								})

								break
							}

							case ts.SyntaxKind.Identifier: {
								const nodeLocation = ref.getFirstAncestor()
								if (!nodeLocation) return

								const parent = moveUpWhileParentFound(nodeLocation, [
									ts.SyntaxKind.TypeAliasDeclaration,
									ts.SyntaxKind.FunctionDeclaration,
									ts.SyntaxKind.ArrowFunction,
									ts.SyntaxKind.SourceFile,
								])
								if (!parent) return

								const parentID = generateNodeID(parent!)
								const isAlreadyRelated = nodes[fnID].relations.some((rel) => {
									return rel.target === parentID
								})
								if (isAlreadyRelated) return

								nodes[fnID].relations.push({
									relation: "USED_IN",
									target: parentID,
								})

								break
							}

							default: {
								unhandledRefKinds.add(ref.getKindName())
								console.log("Unhandled ref", ref.getKindName())
							}
						}
					})
				})
			)
		})
	)
}

async function ingest() {
	console.log("🕒 Ingesting")

	const DIR = [
		//
		"./project",
		"/home/yogesh/Desktop/Rocket.Chat",
	]
	await processCodebase(`${DIR.at(-1)!}/**/*.{ts,tsx}`)
	writeJSON("ingested", nodes)

	console.log()
	console.log()
	console.log("UNIQUE KIND NAMES:\n", kindNames)
	console.log()
	console.log("UNHANDLED REF KIND NAMES:\n", unhandledRefKinds)
	console.log()
	console.log("UNHANDLED KIND NAMES:\n", notFoundKindNames)
	console.log()
	console.log()

	console.log("✅ Ingested")
}

ingest()

// async function a() {
// 	const queryText = await generateEmbeddings("aFunction")

// 	const result = await db.run(
// 		`
// 			CALL db.index.vector.queryNodes("embeddings", 2, $queryText)
// 			YIELD node, score
// 			WHERE score >= 0.9
// 			WITH node
// 			MATCH (node)-[r]->(relatedNode)
// 			RETURN node, COLLECT(relatedNode) AS relatedNodes
// 		`,
// 		{
// 			queryText: queryText,
// 		}
// 	)
// 	console.log(result.records.map((r) => r.get("node").properties.name))
// }

// a()
