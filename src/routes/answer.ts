import { Request, Response } from "express"
import { resolveQuery } from "../core/query"

export async function answerRoute(req: Request, res: Response) {
	const query = req.body.query
	const { answer, diagram } = await resolveQuery(query)
	res.json({ answer, diagram })
}
