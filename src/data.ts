import cliProgress from "cli-progress"
import { writeFileSync } from "fs"
import { db, verifyConnectivity } from "./core/neo4j"
import { DBNode, insertDBNode } from "./node"

export async function ingestData(data: Record<string, DBNode[]>) {
	writeFileSync("data.json", JSON.stringify(data, null, 2))
}

export async function insertDataIntoDB(data: Record<string, DBNode[]>) {
	console.log(await verifyConnectivity())

	const nodes = Object.values(data).flat(6)
	const progressBar = new cliProgress.Bar(
		{ etaBuffer: 1 },
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
