import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import 'dotenv/config';

@Injectable()
export class RedisService {
  public redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
    });
  }
}
