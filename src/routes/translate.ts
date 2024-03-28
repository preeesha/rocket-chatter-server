import { Request, Response } from "express"
import { TRANSLATE_BASE_PROMPT } from "../constants"
import { LLM } from "../core/llm"
import { Query } from "../core/query"
import { writeJSON } from "../core/utils"

export async function __translate__(
	targetEntity: string,
	targetLanguage: string
): Promise<Record<string, string>> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	const codeNodes = await Query.getCodeNodesFromKeywords([targetEntity])
	if (!codeNodes.length) return {}

	writeJSON("results", codeNodes)

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the documentation based on the code nodes and user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const result = await LLM.generateOutput(
		TRANSLATE_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(codeNodes))
			.replace("$TARGET_ENTITY", targetEntity)
			.replace("$TARGET_LANGUAGE", targetLanguage),
		""
	)
	if (!result) return {}

	const data = JSON.parse(result)
	return data
}

export async function translateRoute(req: Request, res: Response) {
	const targetEntity = req.body.targetEntity
	const targetLanguage = req.body.targetLanguage

	try {
		const result = await __translate__(targetEntity, targetLanguage)
		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
