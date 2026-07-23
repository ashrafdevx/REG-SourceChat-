import { Worker } from "bullmq";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createDocument } from "../models/documentModel.js";
import { ensureCollection, upsertPoints } from "../models/qdrantClient.js";
import { generateEmbedding } from "../models/embeddingGenerator.js";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
};

/**
 * BullMQ Worker for processing uploaded PDF files
 * Uses LangChain's PDFLoader to extract documents with semantic page information
 * Stores extracted content in document model for retrieval and search
 */
const worker = new Worker(
  "uploads",
  async (job) => {
    const filePath = job.data.path;
    const originalname = job.data.originalname;
    const mimetype = job.data.mimetype;
    const fileSize = job.data.size;

    try {
      // Validate file exists
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      // Process only PDF files
      if (mimetype === "application/pdf" || originalname.endsWith(".pdf")) {
        console.log(
          `[PDF Processing] Starting processing for job ${job.id}: ${originalname}`,
        );

        // Load PDF using LangChain's PDFLoader
        // PDFLoader returns an array of Document objects, one per page
        const loader = new PDFLoader(filePath);
        const langchainDocs = await loader.load();

        if (!langchainDocs || langchainDocs.length === 0) {
          throw new Error(`No content extracted from PDF: ${originalname}`);
        }

        // Split pages into smaller semantic chunks for downstream search and retrieval.
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const chunkedDocs = await splitter.splitDocuments(langchainDocs);

        if (!chunkedDocs || chunkedDocs.length === 0) {
          throw new Error(`Failed to chunk PDF documents: ${originalname}`);
        }

        // Ensure Qdrant collection exists before storing/embed steps
        await ensureCollection("documents");

        // Store each chunk as a separate document entry and generate embeddings
        const qdrantPoints = [];
        const storedChunks = chunkedDocs.map((chunk, index) => {
          const chunkMetadata = {
            originalFilename: originalname,
            originalMimeType: mimetype,
            originalSize: fileSize,
            originalPages: langchainDocs.length,
            chunkIndex: index + 1,
            totalChunks: chunkedDocs.length,
            source: chunk.metadata.source,
            pdf: chunk.metadata.pdf,
          };

          const chunkId = `${job.id}-${index + 1}`;
          const chunkDocument = {
            id: chunkId,
            filename: originalname,
            mimetype,
            uploadedAt: new Date().toISOString(),
            text: chunk.pageContent,
            numPages: 1,
            metadata: chunkMetadata,
            filePath,
            size: fileSize,
          };

          createDocument(chunkDocument);
          return chunk;
        });

        // Generate embeddings for all chunks
        console.log(
          `[PDF Processing] Generating embeddings for ${storedChunks.length} chunks...`,
        );
        const chunkTexts = storedChunks.map((chunk) => chunk.pageContent);

        for (let i = 0; i < storedChunks.length; i++) {
          const chunkId = `${job.id}-${i + 1}`;
          const chunkText = storedChunks[i].pageContent;

          try {
            const vector = await generateEmbedding(chunkText);
            console.log("vector", vector);
            if (vector && vector.length > 0) {
              qdrantPoints.push({
                id: chunkId,
                vector: vector,
                payload: {
                  filename: originalname,
                  chunkIndex: i + 1,
                  totalChunks: storedChunks.length,
                  text: chunkText.substring(0, 500), // Store first 500 chars in payload
                  uploadedAt: new Date().toISOString(),
                },
              });
            }
          } catch (err) {
            console.warn(
              `[PDF Processing] Failed to embed chunk ${i + 1}: ${err.message}`,
            );
          }
        }

        // Upsert all vectors to Qdrant
        if (qdrantPoints.length > 0) {
          await upsertPoints("documents", qdrantPoints);
        }

        console.log(`[PDF Processing] Successfully chunked job ${job.id}:`, {
          filename: originalname,
          pages: langchainDocs.length,
          chunkCount: storedChunks.length,
          embeddedChunks: qdrantPoints.length,
          sizeKB: (fileSize / 1024).toFixed(2),
        });

        return storedChunks;
      }

      // Handle non-PDF files
      const stats = fs.statSync(filePath);
      console.log(`[File Processing] Processed non-PDF file: ${originalname}`);

      return {
        success: true,
        jobId: job.id,
        message: "Non-PDF file received and logged",
        fileInfo: {
          filename: originalname,
          mimetype,
          size: stats.size,
          uploadedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`[Job ${job.id}] Processing failed:`, error.message);
      throw error; // BullMQ will catch and mark job as failed
    }
  },
  { connection },
);

// Event handlers for job completion and failure
worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

export default worker;
