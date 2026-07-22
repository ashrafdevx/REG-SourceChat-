// In-memory document store (can be replaced with database later)
let documents = [];

export const createDocument = (docData) => {
  const document = {
    id: docData.id,
    filename: docData.filename,
    mimetype: docData.mimetype,
    uploadedAt: docData.uploadedAt,
    text: docData.text || null,
    numPages: docData.numPages || null,
    metadata: docData.metadata || {},
    filePath: docData.filePath,
    size: docData.size,
    createdAt: new Date(),
  };

  documents.push(document);
  console.log(`Document stored:`, {
    id: document.id,
    filename: document.filename,
  });
  return document;
};

export const getDocumentById = (id) => {
  return documents.find((doc) => doc.id === id);
};

export const getAllDocuments = () => {
  return documents;
};

export const deleteDocument = (id) => {
  const index = documents.findIndex((doc) => doc.id === id);
  if (index > -1) {
    const deleted = documents.splice(index, 1);
    return deleted[0];
  }
  return null;
};

export const searchDocuments = (query) => {
  if (!query) return documents;

  const lowerQuery = query.toLowerCase();
  return documents.filter((doc) => {
    return (
      doc.filename.toLowerCase().includes(lowerQuery) ||
      (doc.text && doc.text.toLowerCase().includes(lowerQuery))
    );
  });
};

export default {
  createDocument,
  getDocumentById,
  getAllDocuments,
  deleteDocument,
  searchDocuments,
};
