import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.8,
    maxTokens: 900,
    // verbose: true,
  });

  const main = async () => {
    // 1. invoke
    // const responseFirst = await model.invoke(
    //   'Give me a summary of the movie "Inception".'
    // );
    // console.log(responseFirst.content);
    // 2. batch
    // const response = await model.batch(["Hi", "How are you?"]);
    // console.log(response);
    // 3. stream
    const response = await model.stream(
      "hi give me recommendation for four movies"
    );
    for await (const res of response) {
      console.log(res.content);
    }
  };
  
  main();




//1. This code demonstrates the use of the LangChain library, which provides a higher-level abstraction over the
// standard OpenAI API. Here's a simple explanation of what's happening:

// 2.The code creates a ChatOpenAI model instance with specific parameters like model name,
// temperature, and max tokens.

// The main function showcases three different ways to interact with the model:
// a. invoke: Sends a single prompt and gets a response.
// b. batch: Sends multiple prompts at once.
// c. stream: Streams the response in real-time.

// The main differences from the standard OpenAI library are:
// 1. Simplified setup: LangChain handles the API key and other configurations more easily.
// 2. Higher-level abstractions: Methods like invoke, batch, and stream provide more convenient ways to interact with the model.
// 3. Streaming support: LangChain makes it easier to handle streaming responses.
// 4. Integration with other tools: While not shown here, LangChain can easily integrate with other AI tools and data sources.