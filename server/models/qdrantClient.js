// Lightweight Qdrant client wrapper with dynamic import and helpers
// Tries to load the most common JS Qdrant clients and exposes a small API
// to initialize the client and ensure a collection exists.

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";

let client = null;

async function initQdrantClient() {
  if (client) return client;

  // Try the official JS client first
  try {
    // @qdrant/js-client-rest
    const mod = await import("@qdrant/js-client-rest");
    client = new mod.QdrantClient({ url: QDRANT_URL });
    return client;
  } catch (e) {
    // fallthrough
  }

  try {
    // try generic qdrant-client package (API may vary)
    const mod2 = await import("qdrant-client");
    // some clients export default or named constructors
    const QdrantCtor = mod2.QdrantClient || mod2.default || mod2;
    // try a few constructor signatures
    try {
      client = new QdrantCtor({ url: QDRANT_URL });
    } catch (err) {
      try {
        client = new QdrantCtor(QDRANT_URL);
      } catch (err2) {
        client = QdrantCtor; // last resort
      }
    }
    return client;
  } catch (err) {
    console.warn(
      "No Qdrant client library is installed. Install @qdrant/js-client-rest for full Qdrant support.",
    );
    throw err;
  }
}

export async function ensureCollection(collectionName, vectorSize = 1536) {
  const c = await initQdrantClient();
  if (!c) return;

  try {
    // Modern client exposes "getCollections" or "collections" methods
    if (c.getCollections) {
      const res = await c.getCollections();
      const exists = (res.collections || []).some(
        (x) => x.name === collectionName,
      );
      if (!exists && c.createCollection) {
        await c.createCollection({
          collection_name: collectionName,
          vectors: { size: vectorSize, distance: "Cosine" },
        });
      }
    } else if (c.collections && c.collections.list) {
      const list = await c.collections.list();
      const exists = list.some((x) => x.name === collectionName);
      if (!exists && c.collections.create) {
        await c.collections.create({
          name: collectionName,
          vectors: { size: vectorSize, distance: "Cosine" },
        });
      }
    } else {
      console.warn(
        "Qdrant client present but collection API shape not recognized.",
      );
    }
    console.log(`Qdrant: ensured collection '${collectionName}'`);
  } catch (err) {
    console.warn("Qdrant ensureCollection failed:", err?.message || err);
  }
}

export async function getClient() {
  return initQdrantClient();
}

export async function upsertPoints(collectionName, points) {
  const c = await initQdrantClient();
  if (!c || !points || points.length === 0) {
    console.warn("No points to upsert or Qdrant client not available");
    return;
  }

  try {
    // Try different client API signatures
    if (c.upsert) {
      await c.upsert(collectionName, { points });
    } else if (c.points && c.points.upsert) {
      await c.points.upsert(collectionName, { points });
    } else {
      console.warn("Qdrant client upsert method not recognized");
    }
    console.log(
      `[Qdrant] Upserted ${points.length} points into collection '${collectionName}'`,
    );
  } catch (err) {
    console.error("Qdrant upsertPoints failed:", err?.message || err);
  }
}

export default {
  ensureCollection,
  getClient,
  upsertPoints,
};
