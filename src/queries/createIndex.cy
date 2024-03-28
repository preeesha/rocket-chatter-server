CREATE VECTOR INDEX "embeddings"
FOR (n: Node) ON (n.embedding)
OPTIONS {indexConfig: {
 "vector.dimensions": 768,
 "vector.similarity_function": 'cosine'
}}
