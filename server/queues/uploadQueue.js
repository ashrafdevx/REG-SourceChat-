import { Queue } from "bullmq";

// Connects to Redis on localhost by default. Adjust connection if needed.
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
};

export const uploadQueue = new Queue("uploads", { connection });

export default uploadQueue;
