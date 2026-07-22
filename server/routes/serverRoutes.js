import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { checkServer, uploadFile } from "../controllers/serverController.js";

const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});

const router = express.Router();

router.get("/status", checkServer);
router.post("/upload", upload.any(), uploadFile);

export default router;
