import { writeFileSync } from "fs"
import {
	DB_QUERY_BASE_PROMPT,
	DIAGRAM_BASE_PROMPT,
	QA_BASE_PROMPT,
} from "../constants"
import { LLM } from "./llm"
import { db } from "./neo4j"

function writeText(file: string, data: string) {
	writeFileSync(`${file}.data.json`, data)
}

function writeJSON(file: string, data: any) {
	writeText(file, JSON.stringify(data, null, 2))
}

async function getCodeNodesFromKeywords(keywords: string[]): Promise<any[]> {
	const results: any[] = []
	for (const keyword of keywords) {
		const queryText = await LLM.generateEmbeddings(keyword)
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
	const content = await LLM.generateOutput(DB_QUERY_BASE_PROMPT, query)
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
	const answerContent = await LLM.generateOutput(
		QA_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)),
		query
	)
	if (!diagramRequired) return [answerContent, null]

	const diagramContent = await LLM.generateOutput(
		DIAGRAM_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(nodes)),
		query
	)

	return [answerContent, diagramContent]
}

export async function resolveQuery(query: string): Promise<{
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
	if (!keywords.length) return { answer: "", diagram: null }
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
