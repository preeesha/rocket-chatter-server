import { Request, Response } from "express"
import { STYLEGUIDE_BASE_PROMPT } from "../constants"
import { LLM } from "../core/llm"
import { db } from "../core/neo4j"

export async function __styleguide__(targetEntity: string): Promise<string> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Query the database to find the nodes which contains the styleguide rules
	 * ---------------------------------------------------------------------------------------------
	 */
	const dbResults = await db.run(`MATCH (n:Styleguide) RETURN n`)
	const styleGuides = dbResults.records.map(
		(record) => record.get("n").properties
	)
	if (!styleGuides.length) return ""

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Generate the new code based on the styleguide nodes and user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const result = await LLM.generateOutput(
		STYLEGUIDE_BASE_PROMPT.replace(
			"$STYLEGUIDES",
			JSON.stringify(styleGuides)
		).replace("$TARGET_ENTITY", targetEntity)
	)
	if (!result) return ""

	const answer = result.split("CORRECTED CODE:\n---\n")[1].trim()
	return answer
}

export async function styleguideRoute(req: Request, res: Response) {
	const query = req.body.query

	try {
		const result = await __styleguide__(query)
		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
