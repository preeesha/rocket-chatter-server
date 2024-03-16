import cliProgress from "cli-progress"
import { Transaction } from "neo4j-driver"
import { db, verifyConnectivity } from "../core/neo4j"
import { DBNode, NODE_NAMES_MAP } from "./node.types"

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

export async function insertDataIntoDB(data: Record<string, DBNode[]>) {
	console.log(await verifyConnectivity())

	const nodes = Object.values(data).flat(6)
	const progressBar = new cliProgress.Bar(
		{
			etaBuffer: 1,
			forceRedraw: true,
			fps: 60,
			format:
				"Inserting nodes [{bar}] {percentage}% | {value}/{total} | {duration}s",
		},
		cliProgress.Presets.legacy
	)
	progressBar.start(nodes.length + 1, 0)

	const tx = db.beginTransaction()

	await tx.run("MATCH (n) DETACH DELETE n")
	progressBar.increment()

	const jobs = []
	for (const nodes of Object.values(data)) {
		const fileNode: DBNode = {
			name: "File",
			kind: "File",
			type: "File",
			text: "",
			comments: [],
			filePath: nodes[0].filePath,
			children: [],
		}

		jobs.push(insertDBNode(tx, fileNode, []))
		for (const node of nodes) {
			jobs.push(
				insertDBNode(tx, node, [
					{ relation: "IS_DECLARED_IN", with: fileNode, type: "in" },
				]).then(() => progressBar.increment())
			)
		}
	}
	await Promise.all(jobs)

	progressBar.stop()

	try {
		console.log("Committing transaction")
		await tx.commit()
	} catch (e) {
		console.error(e)
		await tx.rollback()
	}

	console.log("Inserted data into DB")
}
