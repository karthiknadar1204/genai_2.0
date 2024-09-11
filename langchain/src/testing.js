import "dotenv/config";
import express from "express";
import fileUpload from "express-fileupload";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

import { GPTScript, RunEventType } from "@gptscript-ai/gptscript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
  })
);

app.use(fileUpload());

const g = new GPTScript({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o", // Updated model to gpt-4-0314
  });

const EXTRACTED_TEXTS_DIR = path.join(__dirname, "extracted_texts");
const STORIES_DIR = path.join(__dirname, "stories");

if (!fs.existsSync(EXTRACTED_TEXTS_DIR)) {
  fs.mkdirSync(EXTRACTED_TEXTS_DIR, { recursive: true });
}

if (!fs.existsSync(STORIES_DIR)) {
  fs.mkdirSync(STORIES_DIR, { recursive: true });
}

async function extractTextFromPDF(pdfBuffer) {
  try {
    const tempFilePath = path.join(
      EXTRACTED_TEXTS_DIR,
      `temp_${Date.now()}.pdf`
    );
    fs.writeFileSync(tempFilePath, pdfBuffer);

    const loader = new PDFLoader(tempFilePath, {
      splitPages: false,
    });

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      separators: [`. \n`],
    });

    const splittedDocs = await splitter.splitDocuments(docs);

    fs.unlinkSync(tempFilePath);

    const text = splittedDocs.map((doc) => doc.pageContent).join("\n");
    const numPages = docs[0].metadata.pdf.numPages;

    return { text, numPages };
  } catch (error) {
    throw new Error("Failed to extract text from PDF");
  }
}

app.post("/upload", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No file part" });
    }

    const pdfFile = req.files.file;

    if (!pdfFile.name.endsWith(".pdf")) {
      return res.status(400).json({ error: "File is not a PDF" });
    }

    console.log(`Received file: ${pdfFile.name}`);

    const { text, numPages } = await extractTextFromPDF(pdfFile.data);

    const uniqueId = uuidv4();
    const storyDir = path.join(STORIES_DIR, uniqueId);
    fs.mkdirSync(storyDir, { recursive: true });

    // // Split the extracted text into 5 parts
    // const textParts = text.split(/\n+/);
    // const partSize = Math.ceil(textParts.length / 5);
    // const parts = [];
    // for (let i = 0; i < 5; i++) {
    //   parts.push(textParts.slice(i * partSize, (i + 1) * partSize).join('\n'));
    // }

    // // Write each part to a separate file
    // const storyFiles = parts.map((part, index) => {
    //   const fileName = `story-${index + 1}.txt`;
    //   const filePath = path.join(storyDir, fileName);
    //   fs.writeFileSync(filePath, part, 'utf8');
    //   return fileName;
    // });

    

    async function query(data) {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.blob();
      return result;
    }

    const imagePromises = storyFiles.map(async (file, index) => {
      const storyContent = fs.readFileSync(path.join(storyDir, file), 'utf8');
      const imagePrompt = `Create a high-quality, detailed image based on this text: ${storyContent}`;
      const image = await query({
        "inputs": imagePrompt,
        "parameters": {
          "negative_prompt": "blurry, low quality, distorted",
          "num_inference_steps": 50,
          "guidance_scale": 7.5,
          "width": 1024,
          "height": 1024
        }
      });
      
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const imagePath = path.join(storyDir, `b-roll-${index + 1}.png`);
      fs.writeFileSync(imagePath, buffer);
      return imagePath;
    });

    const generatedImages = await Promise.all(imagePromises);

    if (generatedImages.length === 0) {
      throw new Error("No images were generated");
    }

    return res.status(200).json({
      message: "PDF processed, story split, and high-quality images generated successfully.",
      extractedTextId: uniqueId,
      number_of_pages: numPages,
      storyDir: uniqueId,
      generatedImages: generatedImages,
    });
  } catch (error) {
    console.error("Error processing the PDF upload:", error.message);
    return res.status(500).json({ error: "Failed to process the PDF", details: error.message });
  }
});

const PORT = 8001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
