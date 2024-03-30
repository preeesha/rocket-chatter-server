import { Request, Response } from "express"
import { renderDiagramToBase64URI } from "../core/diagram"
import { LLM } from "../core/llm"
import { Query } from "../core/query"
import { Prompts } from "../prompts"

export async function __searchUsage__(
	query: string
): Promise<Record<string, string>> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Extract the possible keywords from the user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const keywords = await Query.getDBKeywordsFromQuery(query)
	if (!keywords.length) return {}

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	const codeNodes = await Query.getCodeNodesFromKeywords(keywords)
	if (!codeNodes.length) return {}

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the answer and diagram for the user's query given the nodes data
	 * ---------------------------------------------------------------------------------------------
	 */
	const result = await LLM.generateOutput(
		Prompts.makeSearchUsagePrompt(JSON.stringify(codeNodes), query)
	)
	if (!result) return {}

	const data = JSON.parse(result)

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 4:
	 * Generate the diagram for the user's query given the nodes data
	 * ---------------------------------------------------------------------------------------------
	 */
	if (!data.diagram) return data
	data.diagram = await renderDiagramToBase64URI(data.diagram)

	return data
}

export async function searchUsageRoute(req: Request, res: Response) {
	const query = req.body.query
	try {
		const result = await __searchUsage__(query)
		res.status(200).json(result)
	} catch (error) {
		console.log(error)
		res.status(500).json({ status: "ERROR" })
	}
}
