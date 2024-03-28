import { Request, Response } from "express"
import { DOCUMENT_BASE_PROMPT } from "../constants"
import { LLM } from "../core/llm"
import { Query } from "../core/query"

export async function __document__(
	query: string
): Promise<Record<string, string> | null> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Extract the possible keywords from the user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const keyword = (await Query.getDBKeywordsFromQuery(query))[0]
	if (!keyword) return {}

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	const codeNodes = await Query.getCodeNodesFromKeywords([keyword])
	if (!codeNodes.length) return {}

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the documentation based on the code nodes and user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const result = await LLM.generateOutput(
		DOCUMENT_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(codeNodes))
			.replace("$TARGET_ENTITY", keyword)
			.replace("$EXAMPLE_USAGES", "2"),
		query
	)
	if (!result) return {}

	const data = JSON.parse(result)

	return { jsDoc: data[0], explaination: data[1] }
}

export async function documentRoute(req: Request, res: Response) {
	const query = req.body.query
	try {
		const result = await __document__(query)
		if (!result) return res.status(400).json({ status: "ERROR" })

		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
