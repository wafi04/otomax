import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisClientService } from './redis-client.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(private readonly redisClient: RedisClientService) { }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async getObject<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redisClient.setex(key, ttlSeconds, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async setObject<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.set(key, serialized, ttlSeconds);
  }

  async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  async setUserSession(token: string, userData: any, ttlSeconds: number = 3600): Promise<void> {
    const key = `session:${token}`;
    await this.setObject(key, userData, ttlSeconds);
  }

  async getUserSession<T>(token: string): Promise<T | null> {
    const key = `session:${token}`;
    return await this.getObject<T>(key);
  }

  async setTokenMapping(token: string, userId: string, ttlSeconds: number = 3600): Promise<void> {
    const key = `token_map:${token}`;
    await this.setObject(key, { userId, createdAt: new Date() }, ttlSeconds);
  }

  async ping(): Promise<string> {
    return await this.redisClient.ping();
  }
}