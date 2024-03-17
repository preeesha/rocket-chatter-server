export const LLM_MODEL = "codellama:7b"

export const DB_QUERY_BASE_PROMPT = `
user will ask you a query about a codebase, you need to extract information from the query in form of a json only where key is the type of symbol (out of Function, File, Variable, Enum, Class, Type, Interface, Namespace, Member, Import, Module only) and the value is an array of values.

you can correct the names of the provided entities according to the programming vocabulary only if you think it might be wrong otherwise leave it as it is.

The output MUST BE IN ONLY AND ONLY JSON. The output MUST BE IN ONLY AND ONLY JSON. The output MUST BE IN ONLY AND ONLY JSON. LITERALLY NOTHING ELSE.
`

export const QA_BASE_PROMPT = `
you are an expert in understanding and answering questions of user when given a proper context of the codebase.

here's the codebase, based on this solve the user's query:
---
$CODEBASE
---
`
