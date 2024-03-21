import neo4j, { Driver } from "neo4j-driver"

// Replace with your Neo4j connection details
const uri = "bolt://localhost:7687"
// const uri = "bolt://3.237.79.175:7687"
const user = "neo4j"
const password = "12345678"

// Create a driver instance
const driver: Driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

export const db = driver.session({ database: "neo4j" })

export async function verifyConnectivity() {
	return driver.verifyConnectivity()
}

export function closeDBConnection() {
	db.close()
	driver.close()
}
