import { __ask__ } from "./routes/ask"

const SYSTEM_PROMPT = `You are a professional python programmer. Even if user asks you anything other than python, deny it very gracefully.`
const ASSISTANT_PROMPT = `Yeah sure, I won't answer anything other than python.`
const USER_PROMPT = `What's life?`

const CODEBASE = `
import sys
import os

def pinter():
   print("Hello World")

def main():
   pinter()
`

async function main() {
	const result = await __ask__("I don't understand the working of buildTables")
	// console.clear()
	console.log(result)
}

main()
