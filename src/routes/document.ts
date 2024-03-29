import { Request, Response } from "express"
import { writeFileSync } from "fs"
import { DOCUMENT_BASE_PROMPT } from "../constants"
import { LLM } from "../core/llm"
import { Query } from "../core/query"

export async function __document__(
	targetEntity: string,
	query: string
): Promise<Record<string, string> | null> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	console.log(targetEntity)
	const codeNodes = await Query.getCodeNodesFromKeywords([targetEntity])
	if (!codeNodes.length) return null

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Generate the documentation based on the code nodes and user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const result = await LLM.generateOutput(
		DOCUMENT_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(codeNodes))
			.replace("$TARGET_ENTITY", targetEntity)
			.replace("$EXAMPLE_USAGES", "2"),
		query
	)
	if (!result) return null

	writeFileSync("document.json", result)

	const data = JSON.parse(result)
	console.log(data)

	return { jsDoc: data[0], explanation: data[1] }
}

export async function documentRoute(req: Request, res: Response) {
	const query = req.body.query
	const targetEntity = req.body.targetEntity

	try {
		const result = await __document__(targetEntity, query)
		if (!result) return res.status(400).json({ status: "ERROR" })

		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
