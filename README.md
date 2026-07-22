# REG-SourceChat

## 🔍 Project Overview

`REG-SourceChat` is an AI-powered PDF RAG (Retrieval-Augmented Generation) application built with Node.js. It allows users to upload PDF files, process them asynchronously, extract and chunk document text using LangChain, and prepare the data for semantic search and question answering.

This repository includes:

- a backend API built with `Express.js`
- asynchronous upload processing using `BullMQ`
- PDF parsing with `LangChain`
- document chunking using `RecursiveCharacterTextSplitter`
- Redis-compatible queue storage via `Valkey`
- support for a vector database like `Qdrant`

---

## 🏗️ Architecture

```
      [ Client / UI / CLI ]
                |
                v
        [ Express API Server ]
                |
                v
          [ BullMQ Upload Queue ]
                |
                v
          [ Background Worker ]
                |
  +-------------+----------------------+
  |                                    |
  v                                    v
[ LangChain PDFLoader ]         [ Qdrant Vector DB ]
  |                                    |
  v                                    v
[ Chunked Documents ]          [ Embeddings Storage ]
  |                                    |
  +---------------+--------------------+
                  |
                  v
      [ Semantic Search + RAG Answering ]
```

---

## ⭐ Features

- Upload PDF files using a REST API
- Asynchronous upload processing via `BullMQ`
- PDF text extraction using `LangChain PDFLoader`
- Convert PDFs into LangChain `Document` objects
- Split documents into semantic chunks using `RecursiveCharacterTextSplitter`
- Prepare embeddings for vector search
- Plan to store embeddings in `Qdrant`
- Semantic search over uploaded PDF chunks
- REST API endpoints for upload, document retrieval, search, and deletion
- Basic error handling and logging

---

## 🧩 Tech Stack

- Node.js
- Express.js
- BullMQ
- Redis / Valkey
- LangChain
- Google Gemini API
- Qdrant Vector Database
- Multer
- dotenv

---

## 📁 Project Structure

```text
/ (root)
├── client/                 # UI application source
├── server/                 # API server source
│   ├── controllers/        # Request handlers
│   ├── models/             # In-memory document store
│   ├── queues/             # BullMQ queue and worker
│   ├── routes/             # Express API routes
│   ├── uploads/            # Uploaded PDF files
│   ├── index.js            # Server entry point
│   └── package.json        # Server-specific dependencies
├── docker-compose.yml      # Valkey / Redis service definition
├── package.json            # Root workspace scripts
└── README.md               # Project documentation
```

---

## 🚀 Installation

```bash
git clone https://github.com/ashrafdevx/REG-SourceChat-.git
cd REG-SourceChat-
```

Install root utilities and then backend/frontend dependencies.

```bash
npm install
cd server && npm install
cd ../client && npm install
```

If you only want to run the backend:

```bash
cd server
npm install
```

---

## 🔧 Environment Variables

Create a `.env` file in `server/` with values similar to the example below.

```env
PORT=8080
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QDRANT_URL=http://localhost:6333
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here
GOOGLE_PROJECT_ID=your_google_project_id_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
```

> Note: The current app includes the LangChain and queue processing pipeline. Google Gemini and Qdrant are part of the intended semantic workflow.

---

## 🐳 Docker Setup

The repository ships with a Docker Compose file for a Redis-compatible `Valkey` service.

```bash
docker compose up -d
```

`docker-compose.yml` currently exposes:

- `valkey` on port `6379`

### Optional: Add Qdrant service

If you want a local Qdrant vector database, extend `docker-compose.yml` with:

```yaml
services:
  valkey:
    image: valkey/valkey:latest
    ports:
      - "6379:6379"
    restart: unless-stopped

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    restart: unless-stopped
```

Then start both services:

```bash
docker compose up -d
```

---

## ▶️ Running the Project

### Start the backend server

```bash
cd server
npm run dev
```

### Start the full workspace

```bash
npm run dev
```

### Production-style server run

```bash
cd server
npm start
```

Visit:

- Backend: `http://localhost:8080`
- API prefix: `http://localhost:8080/api`

---

## 📡 API Endpoints

### 1) Health check

```bash
curl http://localhost:8080/api/status
```

**Response**

```json
{
  "status": "ok"
}
```

### 2) Upload a PDF

```bash
curl -X POST http://localhost:8080/api/upload \
  -F "file=@./path/to/document.pdf"
```

**Response**

```json
{
  "message": "Upload accepted"
}
```

### 3) List all stored document chunks

```bash
curl http://localhost:8080/api/documents
```

### 4) Get a document chunk by ID

```bash
curl http://localhost:8080/api/documents/<document-id>
```

### 5) Search documents by query text

```bash
curl "http://localhost:8080/api/documents/search/query?q=contract"
```

### 6) Delete a document chunk

```bash
curl -X DELETE http://localhost:8080/api/documents/<document-id>
```

---

## 📘 Complete RAG Workflow

1. **Upload PDF** via `POST /api/upload`.
2. **Queue the upload** in `BullMQ` so the server returns immediately.
3. **Worker picks up the job** and reads the PDF with `LangChain PDFLoader`.
4. **LangChain creates `Document` objects** from the PDF pages.
5. **Chunk the document** using `RecursiveCharacterTextSplitter` into smaller semantic blocks.
6. **Generate embeddings** for each chunk using Google Gemini.
7. **Store vectors in Qdrant** for semantic retrieval.
8. **Answer user queries** by retrieving the best chunks and using Gemini to generate an answer.

This workflow separates ingestion from query time so large PDF files do not block the API.

---

## 🧠 How BullMQ Processes Uploaded Files

- When a user uploads a PDF, the backend saves it to `server/uploads/`.
- The upload handler enqueues a BullMQ job on the `uploads` queue.
- A dedicated worker consumes jobs from the queue.
- The worker processes the PDF asynchronously, so the HTTP request does not wait for expensive parsing.
- Completed chunks are stored for later retrieval.

This design improves reliability, scalability, and user experience.

---

## 📚 How LangChain Documents, Chunking, Embeddings, and Qdrant Work Together

- `PDFLoader` reads a PDF and creates LangChain `Document` objects.
- `RecursiveCharacterTextSplitter` breaks long documents into smaller semantic chunks.
- Each chunk becomes a candidate for embedding.
- Google Gemini or another embedding provider converts chunk text into numerical vectors.
- Qdrant indexes those vectors so the app can find semantically similar chunks.
- When a query arrives, the system searches Qdrant, retrieves the best chunks, and uses the chunks to build a response.

This combination enables fast, accurate retrieval over document content.

---

## 🔄 Example API Flow: Upload to Answer

1. Upload the PDF

```bash
curl -X POST http://localhost:8080/api/upload \
  -F "file=@./my-report.pdf"
```

2. Worker processes the file asynchronously.
3. Search stored chunks:

```bash
curl "http://localhost:8080/api/documents/search/query?q=budget"
```

4. Use the returned chunks to compose a prompt for Gemini.
5. Generate a RAG answer from the matching chunks.

> In the current backend, semantic query search is available through `/api/documents/search/query`. The next step is to wire the matched chunks into a Gemini-based answer endpoint.

---

## 🚧 Troubleshooting

- `Upload accepted` but no documents appear:
  - Confirm the worker is running and connected to Redis/Valkey.
  - Check logs in `server/` for worker errors.

- `No file found in upload`:
  - Ensure the request uses `multipart/form-data`.
  - Use the `file` field name in the upload form.

- BullMQ connection errors:
  - Verify `REDIS_HOST` and `REDIS_PORT` in `.env`.
  - Confirm `docker compose up -d` started `valkey` successfully.

- PDF processing failures:
  - Validate the uploaded file is a real PDF.
  - Check that `server/uploads/` is writable.

---

## 🔮 Future Improvements

- Add a dedicated `/api/qa` endpoint for question answering
- Persist document metadata in a database instead of in-memory storage
- Store and search embeddings in Qdrant
- Add user authentication and multi-user support
- Add a modern frontend UI for upload and chat
- Improve logging, monitoring, and retry handling for BullMQ
- Add vector search ranking and result reranking

---

## 📜 License

This project is published under the `ISC` license. See `package.json` for license metadata.
