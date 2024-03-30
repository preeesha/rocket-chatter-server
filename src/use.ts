import { __searchUsage__ } from "./routes/searchUsage"

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
	const result = await __searchUsage__("YallistNode")
	// console.clear()
	console.log(result)
}

main()
