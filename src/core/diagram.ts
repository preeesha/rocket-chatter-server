import { exec } from "child_process"
import { randomUUID } from "crypto"
import { unlinkSync, writeFileSync } from "fs"

export async function renderDiagramToBase64URI(
	diagram: string
): Promise<string> {
	const diagramID = randomUUID()
	const diagramMDFileName = `${diagramID}.md`
	const diagramSVGFileName = `${diagramID}.svg`
	const diagramSVGOutputFileName = `${diagramID}-1.svg`

	writeFileSync(diagramMDFileName, diagram)

	await new Promise<void>((resolve, reject) => {
		console.log(`npx mmdc -i ${diagramMDFileName} -o ${diagramSVGFileName}`)
		const diagram = exec(
			`npx mmdc -i ${diagramMDFileName} -o ${diagramSVGFileName}`,
			{
				cwd: process.cwd(),
				timeout: 10000,
			}
		)

		diagram.on("exit", async (code) => {
			unlinkSync(diagramMDFileName)
			if (code === 0) {
				resolve()
			} else {
				console.log(`Error: ${code}`)
				reject()
			}
		})
	})

	const base64 = await new Promise<string>((resolve, reject) => {
		exec(`base64 ${diagramSVGOutputFileName}`, async (err, stdout) => {
			unlinkSync(diagramSVGOutputFileName)
			if (err) reject(err)
			resolve(stdout)
		})
	})

	const uri = `data:image/svg+xml;base64,${base64.trim()}`

	return uri
}
