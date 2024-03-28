import { configDotenv } from "dotenv"
configDotenv()

export const PORT = +(process.env["PORT"] ?? 3000)

export const HF_KEY = process.env["HF_KEY"]
export const OPENAI_KEY = process.env["OPENAI_KEY"]

export const NEO4J_URI = process.env["NEO4J_URI"] ?? ""
export const NEO4J_USERNAME = process.env["NEO4J_USERNAME"] ?? ""
export const NEO4J_PASSWORD = process.env["NEO4J_PASSWORD"] ?? ""
export const NEO4J_DATABASE = process.env["NEO4J_DATABASE"] ?? ""

export const LLM_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"

// --------------------------------------------------------------------------------------
// COMMON PROMPTS
// --------------------------------------------------------------------------------------

export const DB_QUERY_BASE_PROMPT = `
you are an expert in understanding and extracting information from the codebase.
INPUT: User's text query
EXPECTED OUTPUT: An array of strings containing the key entities from the user's query.
POSSIBLE ENTITIES: Files, Function, File, Variable, Enum, Class, Type, Interface, Namespace, Member, Import, Module only.

EXAMPLE 1: If the user query is "main.ts file and the message componenet with hello function" then the output should be ["main.ts", "message component", "hello function"].
EXAMPLE 2: If the user query is "i don't understand the purpose of the 'utils' module" then the output should be ["utils"].
EXAMPLE 3: If the user query is "what is the 'message' component doing in the 'main.ts' file" then the output should be ["message", "main.ts"].

NOTE:
- The entities must be extracted as they are mentioned in the user's query.
- You can correct the names of the provided entities according to the programming vocabulary only if you think it might be wrong otherwise leave it as it is.
- The output MUST BE IN ONLY AND ONLY AN ARRAY OF STRINGS.
- The output MUST BE IN ONLY AND ONLY AN ARRAY OF STRINGS.
- The output MUST BE IN ONLY AND ONLY AN ARRAY OF STRINGS. LITERALLY NOTHING ELSE.
`

// --------------------------------------------------------------------------------------
// COMMANDS PROMPTS
// --------------------------------------------------------------------------------------

export const SUMMARIZE_BASE_PROMPT = `
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

// --------------------------------------------------------------------------------------
