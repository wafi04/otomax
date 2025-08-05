import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisClientService } from './redis-client.service';

@Global()
@Module({
  providers: [RedisClientService, RedisService],
  exports: [RedisClientService, RedisService],
})
export class RedisModule {
  constructor() {
    console.log('🏗️ Class-based RedisModule constructor called');
  }
}