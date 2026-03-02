import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from "dotenv";

dotenv.config();

// redis connection
const redisConn = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
  password: process.env.REDIS_PASSWORD!,
  maxRetriesPerRequest: null,
});

// define worker
const worker = new Worker(
  'in-app-notification',
    async (job) => {
        const response = await fetch(`http://notifications-dev:8000/save`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(job.data),
        });

        if (!response.ok) {
          throw new Error(`Failed to save notification: ${response.statusText}`);
        }
    },
    {
        connection: redisConn,
    },
);

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed`, err);
});

worker.on('error', (err) => {
    console.error('Worker error', err);
});

worker.on('drained', () => {
    console.log('Queue drained');
});
