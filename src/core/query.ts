import { DB_QUERY_BASE_PROMPT } from "../constants"
import { DBNode } from "../database/node.types"
import { LLM } from "./llm"
import { db } from "./neo4j"

export namespace Query {
	export async function getDBNodesFromVectorQuery(
		indexName: string,
		vector: number[],
		threshold: number
	): Promise<DBNode[]> {
		const result = await db.run(
			`
				CALL db.index.vector.queryNodes("${indexName}", 2, $vector)
				YIELD node, score 
				WHERE score >= ${threshold}
				WITH node, score // Include the score here
				MATCH (node)-[r]->(relatedNode)
				RETURN node, COLLECT(relatedNode) AS relatedNodes, score
				ORDER BY score DESC
			`,
			{ vector }
		)

		const data = result.records.map((record) => record.toObject())
		const results: any[] = []
		for (const record of data) {
			const n = record.node.properties
			delete n["nameEmbeddings"]
			delete n["codeEmbeddings"]
			results.push(n)
		}

		return results
	}

	export async function getCodeNodesFromKeywords(
		keywords: string[]
	): Promise<DBNode[]> {
		const results: DBNode[] = []
		for (const keyword of keywords) {
			const queryVector = await LLM.generateEmbeddings(keyword)
			const result = await getDBNodesFromVectorQuery(
				"nameEmbeddings",
				queryVector,
				0.9
			)
			results.push(...result)
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
