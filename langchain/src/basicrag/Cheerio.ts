// 1. MemoryVectorStore from langchain/vectorstores/memory
// Purpose: A MemoryVectorStore is a local in-memory storage mechanism to store vectors or embeddings generated from text data. It's often used
// for querying based on similarity to other vectors.

// Usage: Typically used in applications that require vector-based search (like for embeddings generated from text) without needing persistent storage,
// as the data is stored in-memory and lost when the program terminates.



// 2. ChatPromptTemplate from @langchain/core/prompts
// Purpose: ChatPromptTemplate is a utility for generating dynamic prompts that can be used in chatbot applications. It helps in crafting structured prompts
// for language models to follow when engaging in conversation.

// Usage: This template allows you to combine user inputs with predefined prompt templates to consistently guide the chatbot's responses. It helps in creating
// prompts dynamically for more complex or multi-step workflows.



// 3. CheerioWebBaseLoader from @langchain/community/document_loaders/web/cheerio
// Purpose: CheerioWebBaseLoader is a loader that fetches web content (HTML) and parses it into structured data using the Cheerio library. Cheerio is a lightweight
// library that helps you interact with and manipulate HTML, similar to jQuery.

// Usage: This loader allows you to scrape web pages, load their content, and convert them into text-based documents that can be further processed for tasks such as
// indexing, extracting information, or analyzing text.



// 4. RecursiveCharacterTextSplitter from langchain/text_splitter
// Purpose: The RecursiveCharacterTextSplitter is a utility that splits large chunks of text into smaller sections recursively, based on certain delimiters
// (like sentences, paragraphs, or characters) while trying to preserve semantic meaning.

// Usage: When dealing with large documents or web pages, this tool breaks them down into manageable pieces to ensure they can be processed effectively by
// language models or vector-based search engines. It's particularly useful when token limits exist for certain models.
// Together, these packages can be used for a task like web scraping, splitting content into chunks, storing embeddings, and querying against them in-memory
// to answer questions based on scraped web content.


import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});

const question = "Langchain framework consists of which open source libraries?";

const main = async () => {
  // Create a web loader
  // The CheerioWebBaseLoader is being used to load content from the webpage "https://js.langchain.com/v0.2/docs/introduction/".
  // Essentially, this loader fetches the HTML content of the webpage.
  // The variable docs will store the loaded content from the page in a format that can be processed further.
  const loader = new CheerioWebBaseLoader(
    "https://js.langchain.com/v0.2/docs/introduction/"
  );
  const docs = await loader.load();

  // The RecursiveCharacterTextSplitter is set up with two parameters:
  // chunkSize: 150: This means that the text will be split into chunks of 150 characters each.
  // chunkOverlap: 10: This means that when the text is split, the next chunk will overlap the previous one by 10 characters.
  // This helps preserve context between chunks.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 150,
    chunkOverlap: 10,
  });
  const splittedDocs = await splitter.splitDocuments(docs);

  // Create an embeddings instance
  const embeddings = new OpenAIEmbeddings();


  // Create a vector store (in memory for this example)
  const vectorStore = new MemoryVectorStore(embeddings);


  // Add documents to the vector store
  await vectorStore.addDocuments(splittedDocs);


  // Retrieve the top 3 most similar documents
  const retriever = vectorStore.asRetriever({
    k: 3,
  });


  // The retriever is used to find the most relevant documents based on the user's question.
  // The result is an array of documents that are most similar to the question.
  const result = await retriever.invoke(question);


  // The resultDocuments variable is created by mapping over the result array and extracting the pageContent from each document.
  // This is done to prepare the documents for the chat prompt template.
  const resultDocuments = result.map((doc) => doc.pageContent);


  // build template for chat
  const template = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer to users question based on the following context: {context}.",
    ],
    ["user", "{query}"],
  ]);



// The pipe method in this context is creating a processing chain that combines the ChatPromptTemplate with the ChatOpenAI model. Here's a brief explanation:
// -> template is a ChatPromptTemplate instance that defines the structure of the prompt.
// -> model is a ChatOpenAI instance that represents the language model.

// pipe connects these two components, creating a chain where:
// ->The template will first format the input (query and context)
// ->The formatted prompt will then be sent to the ChatOpenAI model for processing
// This chain allows you to easily pass input to the template and get the model's response in one step, as seen in the chain.invoke() call later in the code.
// The pipe method is part of LangChain's composability features, allowing you to create more complex workflows by chaining together different components.
  const chain = template.pipe(model);

  // The chain is used to generate a response based on the user's question and the context provided by the documents.
  const response = await chain.invoke({
    query: question,
    context: resultDocuments,
  });
  console.log(response.content);
};

main();