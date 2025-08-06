
import { Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis'

@Injectable()
export class RedisClientService extends Redis {
  constructor() {
    console.log('🚀 Creating Redis client service...');
    super({
      url: 'https://desired-chicken-9625.upstash.io',
  token: 'ASWZAAIjcDE1MTc5OTg1NWVkOWU0MmMwOGQ1N2FiMDRmOTk4N2UxMHAxMA',
      cache : "default",

    });

    console.log('✅ Redis client service created');
  }
}
