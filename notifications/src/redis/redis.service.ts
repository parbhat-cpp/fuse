import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import 'dotenv/config';

@Injectable()
export class RedisService {
  public redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });
  }
}
