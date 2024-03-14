import { Transaction } from "neo4j-driver"
import { Node, VariableStatement, ts } from "ts-morph"

export type DBNode = {
	name: string
	kind: string
	type: string

	text: string
	comments: string[]

	filePath: string
	children: DBNode[]
}

const NODE_NAMES_MAP: Record<string, string> = {
	File: "File",
	FunctionDeclaration: "Function",

	Parameter: "Variable",
	BindingElement: "Variable",
	VariableDeclaration: "Variable",
	VariableStatement: "Variable",

	EnumDeclaration: "Enum",
	ClassDeclaration: "Class",
	TypeAliasDeclaration: "Type",
	InterfaceDeclaration: "Interface",
	NamespaceDeclaration: "Namespace",

	MethodDeclaration: "Member",
	PropertyDeclaration: "Member",
	GetAccessor: "Member",
	SetAccessor: "Member",

	ImportDeclaration: "Import",
	ExpressionStatement: "Variable",

	ModuleDeclaration: "Module",
}

export async function insertDBNode(
	tx: Transaction,
	node: DBNode,
	relations: {
		with: DBNode
		relation: string
		type: "in" | "out"
	}[]
): Promise<any> {
	let query = ""
	query += relations
		.map((x, i) => {
			const name = x.with.name.replaceAll('"', '\\"')
			const filePath = x.with.filePath.replaceAll('"', '\\"')
			return `MATCH (${"m" + i}:${x.with.kind} { name: "${name}", kind: "${
				x.with.kind
			}", filePath: "${filePath}" })`
		})
		.join("\n")
	query += "\n"
	query += `CREATE (n:${NODE_NAMES_MAP[node.kind] ?? "Node"} {
		name: $name,
		kind: $kind,
		type: $type,
		text: $text,
		comments: $comments,
		filePath: $filePath
	})`
	query += relations
		.map((x, i) => `\nCREATE (n)-[:${x.relation}]->(${"m" + i})`)
		.join("")

	const jobs = []
	jobs.push(tx.run(query, node).catch(() => console.error(query)))
	for (const child of node.children) {
		jobs.push(
			insertDBNode(tx, child, [
				{ relation: "LOCAL_OF", with: node, type: "out" },
			])
		)
	}
	return Promise.all(jobs)
}

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
