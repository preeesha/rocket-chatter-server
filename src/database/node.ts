import cliProgress from "cli-progress"
import { db, verifyConnectivity } from "../core/neo4j"
import { DBNode, NODE_NAMES_MAP } from "./node.types"

function getNodeDBInsertQuery(node: DBNode): string {
	let query = ""
	query += `CREATE (n:${NODE_NAMES_MAP[node.kind] ?? "Node"} {
		id: $id,
		name: $name,
		kind: $kind,
		type: $type,
		text: $text,
		comments: $comments,
		filePath: $filePath
	})`

	return query
}

export async function insertDataIntoDB(data: Record<string, DBNode>) {
	console.log(await verifyConnectivity())

	const nodes = Object.values(data)
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
	progressBar.start(
		nodes.length + nodes.map((x) => x.relations).flat().length + 1,
		0
	)

	const tx = db.beginTransaction()

	await tx.run("MATCH (n) DETACH DELETE n")
	progressBar.increment()

	await Promise.all(
		nodes.map(async (node) => {
			const query = getNodeDBInsertQuery(node)
			try {
				await tx.run(query, node)
			} catch {
				console.error(query)
			}
			progressBar.increment()
		})
	)

	const jobs: Promise<any>[] = []
	for (const node of nodes) {
		for (const relation of node.relations) {
			const query = [
				`MATCH (n { id: $nID })`,
				`MATCH (m { id: $mID })`,
				`CREATE (n)-[:${relation.relation}]->(m)\n`,
			].join("\n")
			jobs.push(
				tx.run(query, { nID: node.id, mID: relation.target }).then(() => {
					progressBar.increment()
				})
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
