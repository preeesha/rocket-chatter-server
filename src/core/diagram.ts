import { graphviz } from "node-graphviz"

export async function renderDiagramToBase64URI(
	diagram: string
): Promise<string> {
	const svg = await graphviz.circo(diagram, "svg")
	const base64 = Buffer.from(svg).toString("base64")

	const uri = `data:image/svg+xml;base64,${base64}`

	return uri
}
