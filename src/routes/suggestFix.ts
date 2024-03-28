import { Request, Response } from "express"
import { SUGGESTFIX_BASE_PROMPT } from "../constants"
import { LLM } from "../core/llm"
import { Query } from "../core/query"
import { writeJSON } from "../core/utils"

export async function __suggestFix__(
	query: string
): Promise<Record<string, string>> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Extract the possible keywords from the user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const keywords = await Query.getDBKeywordsFromQuery(query)
	if (!keywords.length) return { result: "" }

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	const results = await Query.getCodeNodesFromKeywords(keywords)
	if (!results.length) return { result: "" }

	writeJSON("results", results)

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the answer and diagram for the user's query given the nodes data
	 * ---------------------------------------------------------------------------------------------
	 */
	const answer = await LLM.generateOutput(
		SUGGESTFIX_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(results)),
		query
	)
	if (!answer) return { result: "" }

	return { result: answer }
}

export async function suggestFixRoute(req: Request, res: Response) {
	const query = req.body.query
	try {
		const result = await __suggestFix__(query)
		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
