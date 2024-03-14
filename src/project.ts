import { Node, Project, ts } from "ts-morph"

export type NodeCallback = (node: Node<ts.Node>) => any

export async function processCodebase(path: string, callback: NodeCallback) {
	const project = new Project({ skipAddingFilesFromTsConfig: true })
	project.addSourceFilesAtPaths(path)

	// Iterate over source files
	for (const sourceFile of project.getSourceFiles()) {
		const allNodes = [
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ArrowFunction),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.FunctionDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.FunctionExpression),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.MethodDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ClassDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.InterfaceDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.EnumDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.NamespaceExportDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.VariableStatement),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.TypeAliasDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ImportDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ExportDeclaration),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ExportAssignment),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ExportSpecifier),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ImportSpecifier),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ImportClause),
			...sourceFile.getChildrenOfKind(ts.SyntaxKind.ImportEqualsDeclaration),
		]
		for (const node of allNodes) {
			callback(node)
		}
	}
}
