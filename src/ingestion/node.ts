import { Node, VariableStatement, ts } from "ts-morph"
import { DBNode } from "../database/node.types"

export function makeDBNode(node: Node<ts.Node>): DBNode {
	let name = ""
	switch (node.getKind()) {
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
		name: name,
		kind: node.getKindName(),
		type: node.getType().getText() || "any",

		text: contents,
		comments: comments.map((c) => c.trim()),

		filePath: node.getSourceFile().getFilePath(),
		children: [],
	}

	return n
}
