import express from "express";
import {
  createDocument,
  getDocumentById,
  getAllDocuments,
  deleteDocument,
  searchDocuments,
} from "../models/documentModel.js";

const router = express.Router();

// Get all documents
router.get("/", (req, res) => {
  const documents = getAllDocuments();
  res.status(200).json({ documents, count: documents.length });
});

// Get document by ID
router.get("/:id", (req, res) => {
  const document = getDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.status(200).json(document);
});

// Search documents by filename or text content
router.get("/search/query", (req, res) => {
  const { q } = req.query;
  const results = searchDocuments(q);
  res.status(200).json({ results, count: results.length });
});

// Delete document
router.delete("/:id", (req, res) => {
  const deleted = deleteDocument(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.status(200).json({ message: "Document deleted", deleted });
});

export default router;
