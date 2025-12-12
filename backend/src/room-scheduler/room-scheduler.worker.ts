import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RoomSchedulerWorker');

const redisConn = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

const worker = new Worker(
  'roomSchedulerQueue',
  async (job) => {
    const { roomId } = job.data;
    logger.log('Activating room:', roomId);

    // const redis = new Redis({
    //   host: process.env.REDIS_HOST,
    //   port: parseInt(process.env.REDIS_PORT),
    //   password: process.env.REDIS_PASSWORD,
    // });
    redisConn.publish('room:activate', JSON.stringify({ roomId }));
  },
  {
    connection: redisConn,
  },
);

worker.on('completed', (job) => {
  logger.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed`, err);
});

worker.on('error', (err) => {
  logger.error('Worker error', err);
});

worker.on('active', (job) => {
  logger.log(`Job ${job.id} active`);
});

worker.on('drained', () => {
  logger.log('Queue drained');
});

worker.on('paused', () => {
  logger.log('Worker paused');
});

worker.on('resumed', () => {
  logger.log('Worker resumed');
});
