export type DBNode = {
	id: string
	name: string
	kind: string
	type: string

	text: string
	comments: string[]

	filePath: string
	relations: { target: string; relation: string }[]

	embeddings: number[]
}
