import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisClientService } from './redis-client.service';

@Injectable()
export class RedisService implements OnModuleDestroy {
<<<<<<< HEAD
  constructor(private readonly redisClient: RedisClientService) { }

  async onModuleDestroy() {
    await this.redisClient.quit();
=======
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly redisClient: RedisClientService) {
    this.logger.log('🎉 RedisService initialized with client service');
  }

  async onModuleDestroy() {
    try {
      // Upstash Redis doesn't have a close method like traditional Redis clients
      // The connection is handled automatically via HTTP requests
      this.logger.log('RedisService destroyed');
    } catch (error) {
      this.logger.error('Error during Redis service destruction:', error);
    }
>>>>>>> a49ddd3d53c80d5206ccb30bca48a29992c97c79
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      
      if (!data) {
        return null;
      }
      
      // Handle different data types
      if (typeof data === 'object') {
        // If data is already an object, return it directly
        return data as T;
      }
      
      if (typeof data === 'string') {
        // Try to parse as JSON
        try {
          return JSON.parse(data);
        } catch (parseError) {
          this.logger.warn(`Failed to parse JSON for key ${key}, data: ${data}`);
          return null;
        }
      }
      
      return data as T;
    } catch (error) {
      this.logger.error(`Error getting object for key ${key}:`, error);
      throw error;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, value);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async setObject<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      let serialized: string;
      
      if (typeof value === 'string') {
        serialized = value;
      } else if (typeof value === 'object' && value !== null) {
        serialized = JSON.stringify(value);
      } else {
        serialized = String(value);
      }
      
      await this.set(key, serialized, ttlSeconds);
    } catch (error) {
      this.logger.error(`Error setting object for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      throw error;
    }
  }

  async setUserSession(token: string, userData: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const key = `session:${token}`;
      await this.setObject(key, userData, ttlSeconds);
    } catch (error) {
      this.logger.error(`Error setting user session for token ${token}:`, error);
      throw error;
    }
  }

  async getUserSession<T>(token: string): Promise<T | null> {
    try {
      const key = `session:${token}`;
      return await this.getObject<T>(key);
    } catch (error) {
      this.logger.error(`Error getting user session for token ${token}:`, error);
      throw error;
    }
  }

  async setTokenMapping(token: string, userId: string, ttlSeconds: number = 3600): Promise<void> {
    try {
      const key = `token_map:${token}`;
      await this.setObject(key, { userId, createdAt: new Date().toISOString() }, ttlSeconds);
    } catch (error) {
      this.logger.error(`Error setting token mapping for token ${token}:`, error);
      throw error;
    }
  }

  async deleteUserSession(token: string): Promise<number> {
    try {
      const key = `session:${token}`;
      return await this.del(key);
    } catch (error) {
      this.logger.error(`Error deleting user session for token ${token}:`, error);
      throw error;
    }
  }

  async deleteTokenMapping(token: string): Promise<number> {
    try {
      const key = `token_map:${token}`;
      return await this.del(key);
    } catch (error) {
      this.logger.error(`Error deleting token mapping for token ${token}:`, error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.redisClient.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      throw error;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redisClient.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      throw error;
    }
  }

  // Debug method to inspect raw data
  async getRaw(key: string): Promise<any> {
    try {
      const data = await this.redisClient.get(key);
      this.logger.debug(`Raw data for key ${key}:`, {
        type: typeof data,
        value: data,
        stringified: JSON.stringify(data)
      });
      return data;
    } catch (error) {
      this.logger.error(`Error getting raw data for key ${key}:`, error);
      throw error;
    }
  }

  // Method to fix corrupted session data
  async fixUserSession(token: string, userData: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const key = `session:${token}`;
      
      // Delete the corrupted key first
      await this.del(key);
      
      // Set new clean data
      await this.setObject(key, userData, ttlSeconds);
      
      this.logger.log(`Fixed user session for token: ${token.substring(0, 20)}...`);
    } catch (error) {
      this.logger.error(`Error fixing user session for token ${token}:`, error);
      throw error;
    }
  }
}