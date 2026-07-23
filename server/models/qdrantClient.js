// Lightweight Qdrant client wrapper with dynamic import and helpers
// Tries to load the most common JS Qdrant clients and exposes a small API
// to initialize the client and ensure a collection exists.

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

let client = null;

async function initQdrantClient() {
  if (client) return client;

  // Try the official JS REST client first
  try {
    const mod = await import("@qdrant/js-client-rest");
    // The API uses QdrantClient constructor with just URL
    const QdrantClient = mod.QdrantClient || mod.default;
    client = new QdrantClient({
      url: QDRANT_URL,
    });
    console.log(`[Qdrant] Connected to ${QDRANT_URL}`);
    return client;
  } catch (e) {
    console.warn(`[Qdrant] Failed to load @qdrant/js-client-rest:`, e.message);
  }

  try {
    // try generic qdrant-client package (API may vary)
    const mod2 = await import("qdrant-client");
    const QdrantCtor = mod2.QdrantClient || mod2.default || mod2;
    try {
      client = new QdrantCtor({ url: QDRANT_URL });
    } catch (err) {
      try {
        client = new QdrantCtor(QDRANT_URL);
      } catch (err2) {
        client = QdrantCtor;
      }
    }
    return client;
  } catch (err) {
    console.warn(
      "[Qdrant] No Qdrant client library found. Install @qdrant/js-client-rest.",
    );
  }

  return null;
}

export async function ensureCollection(collectionName, vectorSize = 1536) {
  const c = await initQdrantClient();
  if (!c) return;

  try {
    // Try to get collections
    let collections = [];
    if (c.getCollections) {
      const res = await c.getCollections();
      collections = res.collections || [];
    } else if (c.collections && typeof c.collections === "function") {
      // Some APIs have collections as a method
      const res = await c.collections();
      collections = res.collections || [];
    }

    const exists = collections.some((x) => x.name === collectionName);

    if (!exists) {
      if (c.createCollection) {
        await c.createCollection({
          collection_name: collectionName,
          vectors: {
            size: vectorSize,
            distance: "Cosine",
          },
        });
        console.log(
          `[Qdrant] Created collection '${collectionName}' with ${vectorSize} dimensions`,
        );
      } else {
        console.warn("[Qdrant] createCollection method not available");
      }
    } else {
      console.log(`[Qdrant] Collection '${collectionName}' already exists`);
    }
  } catch (err) {
    console.warn(`[Qdrant] ensureCollection error:`, err?.message || err);
  }
}

export async function getClient() {
  return initQdrantClient();
}

export async function upsertPoints(collectionName, points) {
  const c = await initQdrantClient();
  if (!c || !points || points.length === 0) {
    console.warn("[Qdrant] No points to upsert or Qdrant client not available");
    return;
  }

  try {
    // Convert string IDs to numeric if needed (Qdrant requires numeric IDs)
    const convertedPoints = points.map((p) => ({
      ...p,
      id: typeof p.id === "string" ? hashStringToNumber(p.id) : p.id,
    }));

    // Upsert points into collection
    if (c.upsert) {
      await c.upsert(collectionName, { points: convertedPoints });
    } else {
      console.warn("[Qdrant] upsert method not available");
    }
    console.log(
      `[Qdrant] Upserted ${convertedPoints.length} points into collection '${collectionName}'`,
    );
  } catch (err) {
    console.warn(`[Qdrant] upsertPoints error:`, err?.message || err);
  }
}

// Helper: convert string IDs to numeric (Qdrant requires numeric point IDs)
function hashStringToNumber(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export default {
  ensureCollection,
  getClient,
  upsertPoints,
};
