import { writeFileSync } from "fs"
import { createInterface } from "readline/promises"
import { DB_QUERY_BASE_PROMPT, LLM_MODEL, QA_BASE_PROMPT } from "./constants"
import { closeDBConnection, db } from "./core/neo4j"

import { textGeneration } from "@huggingface/inference"
import { configDotenv } from "dotenv"

configDotenv()

const HF_KEY = process.env["HF_KEY"]

const readline = createInterface({
	input: process.stdin,
	output: process.stdout,
})

function writeJSON(file: string, data: any) {
	writeFileSync(`${file}.data.json`, JSON.stringify(data, null, 2))
}

async function getLLMOutput(
	systemPrompt: string,
	userPrompt: string
): Promise<string> {
	/* OLLAMA BASED LLM USAGE */
	// const reponse = await ollama.chat({
	// 	model: LLM_MODEL,
	// 	options: {
	// 		temperature: 0,
	// 	},
	// 	messages: [
	// 		{ role: "system", content: DB_QUERY_BASE_PROMPT },
	// 		{ role: "user", content: query },
	// 	],
	// })
	// const content = response.message.content
	// return content
	//
	/* HUGGINGFACE BASED LLM USAGE */
	const output = await textGeneration({
		accessToken: HF_KEY,
		model: LLM_MODEL,
		inputs: `${systemPrompt}\n<QUERY_START>\n${userPrompt}\n<QUERY_END>`,
		parameters: {
			temprature: 0,
			max_new_tokens: 20_000,
		},
	})
	const content = output.generated_text.split("<QUERY_END>").at(-1).trim()

	return content
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
		if (!data.length) continue

		results.push(data[0].n.properties)
		for (const record of data) {
			results.push(record.m.properties)
		}
	}

	return results
}

async function getDBKeywordsFromQuery(query: string): Promise<string[]> {
	const content = await getLLMOutput(DB_QUERY_BASE_PROMPT, query)
	const parsedQuery: Record<string, string[]> = JSON.parse(content)
	return Object.values(parsedQuery).flat()
}

async function getAnswerOfUserQueryFromNodesData(
	query: string,
	nodes: any[]
): Promise<string> {
	const content = await getLLMOutput(
		QA_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)),
		query
	)

	return content
}

async function use() {
	// publishRelease
	// i don't understand the architecture of the application

	while (true) {
		console.clear()
		const query =
			// "I don't understand why the hell useArrowController is here and what's the need of it in the main function of message component. also how is it related to the publishRelease function" ||
			// "Why the hell this publishRelease is here" ||
			await readline.question("Enter your query: ")

		const keywords = await getDBKeywordsFromQuery(query)
		console.log("KEYWORDS:", keywords.join(", "))

		const results = await getCodeNodesFromKeywords(keywords)
		console.log("CODE NODES FETCHED")
		writeJSON("results", results)

		const answer = await getAnswerOfUserQueryFromNodesData(query, results)
		console.log("ANSWER:")
		console.log(answer)

		break
	}

	readline.close()
	closeDBConnection()
}

use()
