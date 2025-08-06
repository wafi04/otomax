
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisClientService extends Redis {
  constructor() {
    console.log('🚀 Creating Redis client service...');
    super({
      host: "desired-chicken-9625.upstash.io",
      port: 6379,
      db: 0,
      password: "ASWZAAIjcDE1RTc5OTg1NWVkOWU0MmMwOGQ1N2FiMDRmOTk4N2UxMHAxMA",
      username: "default",
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    console.log('✅ Redis client service created');
  }
}
