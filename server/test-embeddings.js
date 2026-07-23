#!/usr/bin/env node

/**
 * Quick test script for embeddings pipeline
 * Tests:
 * 1. Embedding generation (mock or Gemini)
 * 2. Qdrant collection creation
 * 3. Vector upsert
 */

import {
  ensureCollection,
  getClient,
  upsertPoints,
} from "./models/qdrantClient.js";
import {
  generateEmbedding,
  generateEmbeddings,
} from "./models/embeddingGenerator.js";

async function testEmbeddingsPipeline() {
  console.log("🧪 Testing Embeddings Pipeline...\n");

  try {
    // Test 1: Generate a single embedding
    console.log("✓ Test 1: Generate single embedding");
    const text =
      "This is a test document about artificial intelligence and machine learning.";
    const embedding = await generateEmbedding(text);
    console.log(`  Generated embedding with ${embedding.length} dimensions`);
    console.log(
      `  First 5 values: ${embedding
        .slice(0, 5)
        .map((v) => v.toFixed(4))
        .join(", ")}\n`,
    );

    // Test 2: Generate multiple embeddings
    console.log("✓ Test 2: Generate multiple embeddings");
    const texts = [
      "The future of AI is exciting.",
      "Machine learning models are getting smarter.",
      "Natural language processing enables understanding.",
    ];
    const embeddings = await generateEmbeddings(texts);
    console.log(`  Generated ${embeddings.length} embeddings\n`);

    // Test 3: Ensure Qdrant collection
    console.log("✓ Test 3: Ensure Qdrant collection exists");
    await ensureCollection("test-documents", 1536);
    console.log("  Collection 'test-documents' ready\n");

    // Test 4: Upsert vectors to Qdrant
    console.log("✓ Test 4: Upsert vectors to Qdrant");
    const points = texts.map((t, i) => ({
      id: `test-${i}`,
      vector: embeddings[i],
      payload: {
        text: t,
        index: i,
      },
    }));
    await upsertPoints("test-documents", points);
    console.log(`  Upserted ${points.length} points\n`);

    console.log("✅ All embedding pipeline tests passed!");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }
}

// Run the test
testEmbeddingsPipeline().catch(console.error);
