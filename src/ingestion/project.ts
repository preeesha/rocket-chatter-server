import { Project } from "ts-morph"
import { NodeCallback } from "./project.types"

export async function processCodebase(path: string, callback: NodeCallback) {
	const project = new Project({ skipAddingFilesFromTsConfig: true })
	project.addSourceFilesAtPaths(path)

	// Iterate over source files
	for (const sourceFile of project.getSourceFiles()) {
		const allNodes = [
			...sourceFile.getFunctions(),
			...sourceFile.getVariableStatements(),
			...sourceFile.getEnums(),
			...sourceFile.getClasses(),
			...sourceFile.getTypeAliases(),
			...sourceFile.getInterfaces(),
			...sourceFile.getNamespaces(),
			...sourceFile.getImportDeclarations(),
		]
		for (const node of allNodes) {
			callback(node)
		}
	}
}
