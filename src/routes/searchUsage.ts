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

	const impact = result.split("<IMPACT>")[1].split("</IMPACT>")[0].trim()
	const explanation = result
		.split("<EXPLANATION>")[1]
		.split("</EXPLANATION>")[0]
		.trim()
	const diagram = result.split("<DIAGRAM>")[1].split("</DIAGRAM>")[0].trim()

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 4:
	 * Generate the diagram for the user's query given the nodes data
	 * ---------------------------------------------------------------------------------------------
	 */
	if (!diagram) return { impact, explanation, diagram: "" }
	const renderedDiagram = await renderDiagramToBase64URI(diagram)

	const data = { impact, explanation, diagram: renderedDiagram }
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
