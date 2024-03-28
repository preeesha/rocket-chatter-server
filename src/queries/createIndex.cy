CREATE VECTOR INDEX `embeddings`
FOR (n: Node) ON (n.embeddings)
OPTIONS {indexConfig: {
   `vector.dimensions`: 768,
   `vector.similarity_function`: 'cosine'
}}
