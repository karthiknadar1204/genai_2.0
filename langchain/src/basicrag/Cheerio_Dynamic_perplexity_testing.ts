import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Document } from "langchain/document";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

const googleSearch = async (query: string): Promise<SearchResult[]> => {
  const response = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];
  $('div.g').each((i, element) => {
    const titleElement = $(element).find('h3');
    const title = titleElement.text();
    const link = titleElement.parent('a').attr('href') || '';
    const snippet = $(element).find('div.VwiC3b').text();
    if (title && link && snippet) {
      results.push({ title, link, snippet });
    }
  });
  return results.slice(0, 5); // Return top 5 results
};

const main = async (query: string): Promise<void> => {
  try {
    // Fetch search results
    const searchResults = await googleSearch(query);
    
    // Prepare documents from search results
    const docs: Document[] = searchResults.map(result => new Document({
      pageContent: `${result.title}\n${result.snippet}`,
      metadata: { source: result.link }
    }));

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 150,
      chunkOverlap: 10,
    });
    const splittedDocs = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addDocuments(splittedDocs);

    const retriever = vectorStore.asRetriever({
      k: 3,
    });

    const result = await retriever.invoke(query);
    const resultDocuments = result.map((doc) => doc.pageContent);

    const template = ChatPromptTemplate.fromMessages([
      [
        "system",
        "Answer the user's question based on the following context from Google search results: {context}. After your answer, provide a list of up to 5 relevant web links.",
      ],
      ["user", "{query}"],
    ]);

    const chain = template.pipe(model);

    const response = await chain.invoke({
      query: query,
      context: resultDocuments,
    });

    console.log(response.content);

    console.log("\nRelevant Web Links:");
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   ${result.link}\n`);
    });

  } catch (error) {
    console.error('An error occurred:', error);
  }
};

const userQuery = "tell me something about dhoni?";
main(userQuery).catch(console.error);