import { configDotenv } from "dotenv"
configDotenv()

export const PORT = process.env["PORT"]

export const HF_KEY = process.env["HF_KEY"]
export const OPENAI_KEY = process.env["OPENAI_KEY"]

export const LLM_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"

export const DB_QUERY_BASE_PROMPT = `
user will ask you a query about a codebase, you need to extract information from the query in form of a json only where key is the type of symbol (out of Function, File, Variable, Enum, Class, Type, Interface, Namespace, Member, Import, Module only) and the value is an array of values.
it will also contain one mandotory key called "diagram" which will denote whether there's a need for any kind of diagram or not. if the value is true then you need to provide a diagram for the user to understand the codebase better (true/false).

you can correct the names of the provided entities according to the programming vocabulary only if you think it might be wrong otherwise leave it as it is.

The output MUST BE IN ONLY AND ONLY JSON. The output MUST BE IN ONLY AND ONLY JSON. The output MUST BE IN ONLY AND ONLY JSON. LITERALLY NOTHING ELSE.
`

export const QA_BASE_PROMPT = `
you are an expert in understanding and answering questions of user when given a proper context of the codebase.
even if user asks for any kind of diagram or visualization, you must ignore that and just provide the answer to the user's query.
here's the codebase, based on this solve the user's query:
---
$CODEBASE
---
`

export const DIAGRAM_BASE_PROMPT = `
you are an expert in understanding and answering questions of user when given a proper context of the codebase.

here's the codebase, based on this solve the user's query by generating a comprehensive and informative diagram:
THE OUTPUT MUST ONLY BE IN MERMAID FORMAT. THE OUTPUT MUST ONLY BE IN MERMAID FORMAT. THE OUTPUT MUST ONLY BE IN MERMAID FORMAT.
---
$CODEBASE
---
`
