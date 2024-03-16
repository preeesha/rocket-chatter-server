import { Node, VariableStatement, ts } from "ts-morph"
import { DBNode } from "../database/node.types"

export function generateNodeID(node: Node<ts.Node>) {
	let id = `${node.getSourceFile().getFilePath()}:${node
		.getSymbol()
		?.getName()}:${node.getKind()}`

	return id
}

export function generateFileID(node: Node<ts.Node>) {
	const id = `${node.getSourceFile().getFilePath()}`
	return id
}

export function makeDBNode(node: Node<ts.Node>, isFile?: boolean): DBNode {
	let name = ""
	switch (node.getKind()) {
		case ts.SyntaxKind.SourceFile:
			name = node.getSourceFile().getBaseName()
			break
		case ts.SyntaxKind.VariableStatement:
		case ts.SyntaxKind.ExpressionStatement:
			name = (node as VariableStatement).getDeclarations()?.[0]?.getName() || ""
			break
		case ts.SyntaxKind.TypeAliasDeclaration:
		case ts.SyntaxKind.EnumDeclaration:
		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.VariableDeclaration:
		case ts.SyntaxKind.InterfaceDeclaration:
		case ts.SyntaxKind.PropertyDeclaration:
		case ts.SyntaxKind.ClassDeclaration:
		case ts.SyntaxKind.ModuleDeclaration:
			name = node.getSymbol()?.getName() || ""
			break
		default:
			name = node.getSymbol()?.getFullyQualifiedName().split(".")[1] || ""
			break
	}

	const contents = node.getText().trim()
	const comments = node.getFullText().match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || []

	const n: DBNode = {
		id: isFile ? generateFileID(node) : generateNodeID(node),
		relations: [],

		name: name,
		kind: isFile ? "File" : node.getKindName(),
		type: isFile ? "File" : node.getType().getText() || "any",

		text: contents,
		comments: comments.map((c) => c.trim()),

		filePath: node.getSourceFile().getFilePath(),
	}

	return n
}
