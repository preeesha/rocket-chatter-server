import { Request, Response } from "express"
import { Query } from "../core/query"
import { writeJSON } from "../core/utils"
import { DBNode, DBNodeRelation } from "../database/node.types"

namespace Algorithms {
	function relationCount(node: DBNode, relation: DBNodeRelation): number {
		return 0
		// const count = node.relations.reduce((acc, rel) => {
		// 	if (rel.relation === relation) acc++
		// 	return acc
		// }, 0)
		// return count
	}

	export function calculateFrequencyOfUse(nodes: DBNode[]): number {
		return 0
		// const frequency = nodes.reduce((acc, node) => {
		// 	acc += node.relations.length
		// 	return acc
		// }, 0)
		// return frequency
	}

	export function calculateLinesOfCode(node: DBNode): number {
		const loc = node.code.split("\n").length
		return loc
	}

	export function calculateCentrality(node: DBNode): number {
		const centrality =
			relationCount(node, "CALLED_BY") + relationCount(node, "USED_IN")
		return centrality
	}

	export function calculateCriticality(node: DBNode): number {
		return 0
	}

	export function calculateCyclomaticComplexity(node: DBNode): number {
		return relationCount(node, "DEPENDS_ON")
	}
}

export async function __importance__(
	query: string
): Promise<Record<string, number> | null> {
	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 1:
	 * Extract the possible keywords from the user's query
	 * ---------------------------------------------------------------------------------------------
	 */
	const keywords = await Query.getDBKeywordsFromQuery(query)
	if (!keywords.length) return null

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 2:
	 * Query the database to find the nodes names of which are similar to what user has requested
	 * ---------------------------------------------------------------------------------------------
	 */
	const codeNodes = await Query.getCodeNodesFromKeywords(keywords)
	if (!codeNodes.length) return null

	writeJSON("results", codeNodes)

	/**
	 * ---------------------------------------------------------------------------------------------
	 * STEP 3:
	 * Generate the final score based on various factors
	 * ---------------------------------------------------------------------------------------------
	 */
	const frequency = Algorithms.calculateFrequencyOfUse(codeNodes)
	const loc = Algorithms.calculateLinesOfCode(codeNodes[0])
	const centrality = Algorithms.calculateCentrality(codeNodes[0])
	const criticality = Algorithms.calculateCriticality(codeNodes[0])
	const cyclomaticComplexity = Algorithms.calculateCyclomaticComplexity(
		codeNodes[0]
	)

	const score =
		frequency + loc + centrality + criticality + cyclomaticComplexity

	return { result: score }
}

export async function importanceRoute(req: Request, res: Response) {
	const query = req.body.query
	try {
		const result = await __importance__(query)
		if (!result) return res.status(400).json({ status: "ERROR" })

		res.status(200).json(result)
	} catch (error) {
		console.log(error)
		res.status(500).json({ status: "ERROR" })
	}
}
