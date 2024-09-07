import { Pinecone } from "@pinecone-database/pinecone";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

type MetaData = {
  name: string;
  age: number;
};

// namespace: partion vector data from an index into multiple namespaces or groups. This will make the
//  operations limited to a specific namespace.

// A namespace in Pinecone is a way to partition vector data within an index into separate groups or
// subsets. Here's a concise explanation of its significance:

// 1) Data organization: Namespaces allow you to logically separate different sets of vectors within
//  the same index.

// 2) Scoped operations: When you perform operations like upsert, query, or delete, you can limit them
//  to a specific namespace, which can improve performance and organization.

// 3) Isolation: Different namespaces can contain vectors with the same IDs without conflict, as they're
//  isolated from each other.

// 4) Flexibility: You can use namespaces to separate data by categories, users, or any other logical grouping
//  that makes sense for your application.

// In the given code, createNameSpace function is creating a new namespace called "testing-namespace" within
// the "testing-index". This would allow you to perform operations specifically on this namespace,
// isolating it from other data in the index.
const createNameSpace = async () => {
  const index = getIndex("testing-index");
  const namespace = index.namespace("testing-namespace");
};

//list indexes
const listIndexes = async () => {
  const indexes = await pinecone.listIndexes();
  console.log(indexes);
};

//get index
const getIndex = (indexName: string) => {
  const index = pinecone.index<MetaData>(indexName);
  console.log(index);
  return index;
};

// Generate random vectors:
// This function creates a list of random numbers. Each number is between 0 and 1.
// The length parameter determines how many numbers are in the list. In this case,
// it's creating 1536 random numbers, which together form a "vector" or a long list of numbers.
const generateRandomVectors = (length: number) => {
  return Array.from({ length }, () => Math.random());
};

// "Upsert" is a combination of "update" and "insert". Here's what this function does:
// 1) It generates a random vector of 1536 numbers.
// 2) It gets a reference to a Pinecone index named "testing-index".
// 3) It upserts the vector into the index with the specified ID, values, and metadata:
                    // If an item with the ID "id-2" already exists in the index, it updates that item.
                    // If an item with the ID "id-2" doesn't exist, it inserts a new item.
const upsertVectors = async () => {
  const embedding = generateRandomVectors(1536);
  const index = getIndex("testing-index");

  await index.upsert([
    {
      id: "id-2",
      values: embedding,
      metadata: {
        name: "Uchiha Katsuki",
        age: 25,
      },
    },
  ]);
  console.log("upsert successful");
};

//create index
const createIndex = async () => {
  await pinecone.createIndex({
    name: "testing-index",
    dimension: 1536,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });
};



const queryVectors = async () => {
    const index = getIndex("testing-index");
    const results = await index.query({
      id: "id-2",
      // how many query results to return is determined by topK
      topK: 1,
      includeMetadata: true,
    });
    console.log(results);
  };

// createIndex();
const main = async () => {
  // await listIndexes();
  // getIndex("testing-index");
  await upsertVectors();
//   await queryVectors();
};

main();
