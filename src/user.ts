import { textGeneration } from "@huggingface/inference"
import { writeFileSync } from "fs"
import { createInterface } from "readline/promises"
import {
	DB_QUERY_BASE_PROMPT,
	DIAGRAM_BASE_PROMPT,
	HF_KEY,
	LLM_MODEL,
	QA_BASE_PROMPT,
} from "./constants"
import { closeDBConnection, db } from "./core/neo4j"
import { generateEmbeddings } from "./ingestion/node"

const readline = createInterface({
	input: process.stdin,
	output: process.stdout,
})

function writeText(file: string, data: string) {
	writeFileSync(`${file}.data.json`, data)
}

function writeJSON(file: string, data: any) {
	writeText(file, JSON.stringify(data, null, 2))
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
		const queryText = await generateEmbeddings(keyword)
		const result = await db.run(
			`
			CALL db.index.vector.queryNodes("embeddings", 2, $queryText) 
			YIELD node, score 
			WHERE score >= 0.9
			WITH node 
			MATCH (node)-[r]->(relatedNode) 
			RETURN node, COLLECT(relatedNode) AS relatedNodes
			`,
			{ queryText: queryText }
		)

		const data = result.records.map((record) => record.toObject())
		if (!data.length) continue

		for (const record of data) {
			const n = record.node.properties
			delete n["embeddings"]
			results.push(n)
		}
	}

	return results
}

async function getDBKeywordsFromQuery(
	query: string
): Promise<[string[], boolean]> {
	const content = await getLLMOutput(DB_QUERY_BASE_PROMPT, query)
	const parsedQuery: Record<string, string[]> = JSON.parse(content)
	const diagramRequired = !!parsedQuery["diagram"]
	delete parsedQuery["diagram"]
	return [Object.values(parsedQuery).flat(), diagramRequired]
}

async function getAnswerOfUserQueryFromNodesData(
	query: string,
	nodes: any[],
	diagramRequired: boolean
): Promise<[string, string | null]> {
	const answerContent = await getLLMOutput(
		QA_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)),
		query
	)
	if (!diagramRequired) return [answerContent, null]

	const diagramContent = await getLLMOutput(
		DIAGRAM_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)),
		query
	)

	return [answerContent, diagramContent]
}

async function resolveQuery(query: string): Promise<{
	answer: string
	diagram: string | null
}> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Extract the possible keywords from the user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const [keywords, diagramRequired] = await getDBKeywordsFromQuery(query)
	console.log("KEYWORDS:", keywords.join(", "), "DIAGRAM:", diagramRequired)

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	const results = await getCodeNodesFromKeywords(keywords)
	if (!results.length) return { answer: "", diagram: null }

	writeJSON("results", results)
	console.log("CODE NODES FETCHED")

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the answer and diagram for the user's query given the nodes data
	 * ---------------------------------------------------------------------------------------------
	 */
	const [answer, diagram] = await getAnswerOfUserQueryFromNodesData(
		query,
		results,
		diagramRequired
	)

	return { answer, diagram }
}

async function main() {
	const query = await readline.question("Enter your query: ")
	const { answer, diagram } = await resolveQuery(query)
	console.log("ANSWER:", answer)
	if (diagram) console.log("DIAGRAM:", diagram)

	closeDBConnection()
}

main()
