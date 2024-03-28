export type DBNodeRelation = "USED_IN" | "IN_FILE" | "CALLED_BY"

export type DBNode = {
	id: string
	name: string
	kind: string
	type: string

	text: string
	comments: string[]

	filePath: string
	relations: { target: string; relation: DBNodeRelation }[]

	embeddings: number[]
}
