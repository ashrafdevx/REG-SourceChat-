import { getServerStatus } from "../models/serverModel.js";
import { uploadQueue } from "../queues/uploadQueue.js";

export const checkServer = (req, res) => {
  const serverStatus = getServerStatus();

  res.status(200).json(serverStatus);
};

export const uploadFile = (req, res) => {
  const file = req.file || (req.files && req.files[0]);

  if (!file) {
    return res.status(400).json({ error: "No file found in upload" });
  }
  console.log("Received upload, enqueuing processing job:", {
    field: file.fieldname,
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
  });

  // Enqueue a background job to process the uploaded file so the request
  // can return quickly to the client.
  (async () => {
    try {
      const job = await uploadQueue.add("process-upload", {
        path: file.path,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      console.log("Enqueued upload job", job.id);
    } catch (err) {
      console.error("Failed to enqueue upload job", err);
    }
  })();

  return res.status(202).json({
    message: "Upload accepted",
  });
};
