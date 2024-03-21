import OpenAI from "openai"
import { Node, VariableStatement, ts } from "ts-morph"
import { OPENAI_KEY } from "../constants"
import { DBNode } from "../database/node.types"

const openai = new OpenAI({ apiKey: OPENAI_KEY })

export const notFoundKindNames = new Set<string>()

function getNodeName(node: Node<ts.Node>): string {
	switch (node.getKind()) {
		case ts.SyntaxKind.SourceFile:
			return node.getSourceFile().getBaseName()
		case ts.SyntaxKind.VariableStatement:
		case ts.SyntaxKind.ExpressionStatement:
			return (node as VariableStatement).getDeclarations()?.[0]?.getName() || ""
		case ts.SyntaxKind.TypeAliasDeclaration:
		case ts.SyntaxKind.EnumDeclaration:
		case ts.SyntaxKind.MethodDeclaration:
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.VariableDeclaration:
		case ts.SyntaxKind.InterfaceDeclaration:
		case ts.SyntaxKind.PropertyDeclaration:
		case ts.SyntaxKind.ClassDeclaration:
		case ts.SyntaxKind.ModuleDeclaration:
			return node.getSymbol()?.getName() || ""
		default:
			notFoundKindNames.add(node.getKindName())
			return node.getSymbol()?.getFullyQualifiedName().split(".")[1] || ""
	}
}

export function generateNodeID(node: Node<ts.Node>) {
	let id = `${node.getSourceFile().getFilePath()}:${getNodeName(
		node
	)}:${node.getKind()}`

	return id
}

export function generateFileID(node: Node<ts.Node>) {
	const id = `${node.getSourceFile().getFilePath()}`
	return id
}

export async function generateEmbeddings(name: string): Promise<any> {
	const content = await openai.embeddings.create({
		model: "text-embedding-3-small",
		input: name,
		dimensions: 768,
		encoding_format: "float",
	})
	return content.data[0].embedding
}

export async function makeDBNode(
	node: Node<ts.Node>,
	isFile?: boolean
): Promise<DBNode> {
	let name = getNodeName(node)

	const contents = node.getText().trim()
	const comments = node.getFullText().match(/\/\*[\s\S]*?\*\/|\/\/.*/g) || []

	const n: DBNode = {
		id: isFile ? generateFileID(node) : generateNodeID(node),
		relations: [],

		embeddings: await generateEmbeddings(name),

		name: name,
		kind: isFile ? "File" : node.getKindName(),
		type: isFile ? "File" : node.getType().getText() || "any",

		text: contents,
		comments: comments.map((c) => c.trim()),

		filePath: node.getSourceFile().getFilePath(),
	}

	return n
}
