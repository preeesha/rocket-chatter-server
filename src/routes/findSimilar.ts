import { Request, Response } from "express"
import { LLM } from "../core/llm"
import { Query } from "../core/query"

export async function __findSimilar__(code: string): Promise<string[]> {
	const queryVector = await LLM.generateEmbeddings(code)
	const similarNodes = await Query.getDBNodesFromVectorQuery(
		"codeEmbeddings",
		queryVector,
		0.5
	)
	const data: string[] = similarNodes.map((x) => x.code)

	return data
}

export async function findSimilarRoute(req: Request, res: Response) {
	const query = req.body.query
	try {
		const result = await __findSimilar__(query)
		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
