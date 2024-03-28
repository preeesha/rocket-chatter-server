import { DB_QUERY_BASE_PROMPT } from "../constants"
import { LLM } from "./llm"
import { db } from "./neo4j"

export namespace Query {
	export async function getCodeNodesFromKeywords(
		keywords: string[]
	): Promise<any[]> {
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

	export async function getDBKeywordsFromQuery(
		query: string
	): Promise<string[]> {
		const content = await LLM.generateOutput(DB_QUERY_BASE_PROMPT, query)
		if (!content) return []

		const keywords: string[] = JSON.parse(content)
		return keywords
	}
}
