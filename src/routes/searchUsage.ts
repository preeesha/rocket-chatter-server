import { Request, Response } from "express"
import { SEARCHUSAGE_BASE_PROMPT } from "../constants"
import { LLM } from "../core/llm"
import { Query } from "../core/query"
import { writeJSON } from "../core/utils"

import { exec } from "child_process"
import { randomUUID } from "crypto"
import { writeFileSync } from "fs"
import { unlink } from "fs/promises"

async function renderDiagramToBase64URI(diagram: string): Promise<string> {
	const diagramID = randomUUID()
	const diagramMDFileName = `${diagramID}.md`
	const diagramSVGFileName = `${diagramID}.svg`
	const diagramSVGOutputFileName = `${diagramID}-1.svg`

	writeFileSync(diagramMDFileName, diagram)

	await new Promise<void>((resolve, reject) => {
		const diagram = exec(
			`npx mmdc -i ${diagramMDFileName} -o ${diagramSVGFileName}`,
			{
				cwd: process.cwd(),
				timeout: 10000,
			}
		)

		diagram.on("exit", async (code) => {
			await unlink(diagramMDFileName)
			if (code === 0) {
				resolve()
			} else {
				reject()
			}
		})
	})

	const base64 = await new Promise<string>((resolve, reject) => {
		exec(`base64 ${diagramSVGOutputFileName}`, async (err, stdout) => {
			await unlink(diagramSVGOutputFileName)
			if (err) reject(err)
			resolve(stdout)
		})
	})

	const uri = `data:image/svg+xml;base64,${base64}`

	return uri
}

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

	writeJSON("results", codeNodes)

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the answer and diagram for the user's query given the nodes data
	 * ---------------------------------------------------------------------------------------------
	 */
	const result = await LLM.generateOutput(
		SEARCHUSAGE_BASE_PROMPT.replace("$CODEBASE", JSON.stringify(codeNodes)),
		query
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
		res.status(500).json({ status: "ERROR" })
	}
}
