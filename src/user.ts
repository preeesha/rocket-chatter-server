import { writeFileSync } from "fs"
import ollama from "ollama"
import { createInterface } from "readline/promises"
import { DB_QUERY_BASE_PROMPT, LLM_MODEL, QA_BASE_PROMPT } from "./constants"
import { closeDBConnection, db } from "./core/neo4j"

const readline = createInterface({
	input: process.stdin,
	output: process.stdout,
})

function writeJSON(file: string, data: any) {
	writeFileSync(`${file}.data.json`, JSON.stringify(data, null, 2))
}

async function getDBKeywordsFromQuery(query: string): Promise<string[]> {
	const reponse = await ollama.chat({
		model: LLM_MODEL,
		options: {
			temperature: 0,
		},
		messages: [
			{ role: "system", content: DB_QUERY_BASE_PROMPT },
			{ role: "user", content: query },
		],
	})

	const parsedQuery: Record<string, string[]> = JSON.parse(
		reponse.message.content
	)

	return Object.values(parsedQuery).flat()
}

async function getCodeNodesFromKeywords(keywords: string[]): Promise<any[]> {
	const results: any[] = []
	for (const keyword of keywords) {
		const result = await db.run(
			`
					MATCH (n:Function {name: $keyword})-[r]-(m)
					RETURN n, type(r), m
					LIMIT 200
				`,
			{ keyword: keyword }
		)

		const data = result.records.map((record) => record.toObject())
		results.push(data[0].n.properties)
		for (const record of data) {
			results.push(record.m.properties)
		}
	}

	return results
}

async function getAnswerOfUserQueryFromNodesData(
	query: string,
	nodes: any[]
): Promise<string> {
	console.log(QA_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)))
	const response = await ollama.chat({
		model: LLM_MODEL,
		options: {
			temperature: 0,
		},
		messages: [
			{
				role: "system",
				content: QA_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)),
			},
			{ role: "user", content: query },
		],
	})

	const answer = response.message.content

	return answer
}

async function use() {
	// publishRelease

	while (true) {
		console.clear()
		const query =
			// "Why the hell this publishRelease is here" ||
			await readline.question("Enter your query: ")

		const keywords = await getDBKeywordsFromQuery(query)
		console.log("KEYWORDS:", keywords.join(", "))

		const results = await getCodeNodesFromKeywords(keywords)
		console.log("CODE NODES FETCHED")
		writeJSON("results", results)

		await readline.question("")

		// const answer = await getAnswerOfUserQueryFromNodesData(query, results)
		// console.log("ANSWER:")
		// console.log(answer)
	}

	readline.close()
	closeDBConnection()
}

use()
