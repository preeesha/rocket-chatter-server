import { Request, Response } from "express"

export async function __testCoverage__(
	query: string
): Promise<Record<string, string>> {
	return {}
}

export async function testCoverageRoute(req: Request, res: Response) {
	const query = req.body.query
	try {
		const result = await __testCoverage__(query)
		res.status(200).json(result)
	} catch (error) {
		res.status(500).json({ status: "ERROR" })
	}
}
