import { Worker } from "bullmq";
import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisConn = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
  password: process.env.REDIS_PASSWORD!,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "roomSchedulerQueue",
  async (job) => {
    redisConn.publish("room:activate", JSON.stringify(job.data));
  },
  {
    connection: redisConn,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
  console.log(`Data ${JSON.stringify(job.data)}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

worker.on("error", (err) => {
  console.error("Worker error", err);
});

worker.on("active", (job) => {
  console.log(`Job ${job.id} active`);
});

worker.on("drained", () => {
  console.log("Queue drained");
});

worker.on("paused", () => {
  console.log("Worker paused");
});

worker.on("resumed", () => {
  console.log("Worker resumed");
});
