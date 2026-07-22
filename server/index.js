import express from "express";
import { Queue } from "bullmq";
import cors from "cors";
import router from "./routes/serverRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
// Start background worker for upload processing
import "./queues/worker.js";

const app = express();
const fielqueue = new Queue("upload-file");
// Enable CORS for development (adjust origin in production)
app.use(cors());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("App is running");
});

// Mount API routes under /api
app.use("/api", router);
app.use("/api/documents", documentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
