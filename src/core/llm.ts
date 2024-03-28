import { textGeneration } from "@huggingface/inference"
import OpenAI from "openai"
import { HF_KEY, LLM_MODEL, OPENAI_KEY } from "../constants"

const openai = new OpenAI({ apiKey: OPENAI_KEY })

export namespace LLM {
	export async function generateEmbeddings(name: string): Promise<number[]> {
		const content = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: name,
			dimensions: 768,
			encoding_format: "float",
		})

		return content.data[0].embedding
	}

	export async function generateOutput(
		systemPrompt: string,
		userPrompt: string
	): Promise<string | null> {
		/* OLLAMA BASED LLM USAGE */
		// const reponse = await ollama.chat({
		// 	model: LLM_MODEL,
		// 	options: {
		// 		temperature: 0,
		// 	},
		// 	messages: [
		// 		{ role: "system", content: DB_QUERY_BASE_PROMPT },
		// 		{ role: "user", content: query },
		// 	],
		// })
		// const content = response.message.content
		// return content
		//
		/* HUGGINGFACE BASED LLM USAGE */
		try {
			const output = await textGeneration({
				accessToken: HF_KEY,
				model: LLM_MODEL,
				inputs: `${systemPrompt}\n<QUERY_START>\n${userPrompt}\n<QUERY_END>`,
				parameters: {
					temprature: 0,
					max_new_tokens: 20_000,
				},
			})
			const content = output.generated_text.split("<QUERY_END>").at(-1).trim()
			return content
		} catch (e) {
			console.error(e)
			return null
		}
	}
}
