import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});





//this is the best and most recommended way to create a prompt
const fromTemplate = async () => {
    // Uses ChatPromptTemplate.fromTemplate() instead of ChatPromptTemplate.fromMessages()
    // Takes a single string template rather than an array of message pairs
    // Implicitly creates a single user message, rather than separate system and user messages
    const prompt = ChatPromptTemplate.fromTemplate(
      "Write a summary of the movie {movieName}."
    );
  
    // const inceptionPrompt = await prompt.format({
    //   movieName: "Inception",
    // });
  
    // console.log(inceptionPrompt);
  
    // creating chain: connecting model with prompt
    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      movieName: "inception",
    });
    console.log(response.content);
  };








const fromMessage = async () => {
    // drawback: fromMessage does not have type checking
    // but it will throw error on run time

    // 1. ChatPromptTemplate.fromMessages():
    // This creates a template for the chat conversation.
    // It takes an array of message pairs, where each pair is [role, content].
    // Here, we have two messages:
    // A "system" message providing instructions
    // A "user" message with a placeholder for the movie name

    // 2. prompt:
    // This is the resulting ChatPromptTemplate object.
    // It contains the structure of the conversation to be sent to the AI.
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "Write a summary of the movie {movieName}."],
      ["user", "{movieName}"],
    ]);
  
    // 3. prompt.pipe(model):
    // This creates a "chain" by connecting the prompt template to the AI model.
    // It means: "Take this prompt, fill it with data, then send it to the model."
    const chain = prompt.pipe(model);

    // 4. chain.invoke():
    // This executes the chain we just created.
    // It takes an object with key-value pairs to fill in the template placeholders.
    // Here, it's replacing {movieName} with "inception".
    const response = await chain.invoke({
      movieName: "inception",
    });
    console.log(response.content);
  };

  
//   fromMessage();
fromTemplate();