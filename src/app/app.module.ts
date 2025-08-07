import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import jwtConfig from '../common/configs/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { RedisModule } from '../lib/redis/redis.module';
import { AuthModule } from '../services/auth/auth.module';
import { CategoryModule } from '../services/category/category.module';
import { ProductModule } from 'src/services/service/service.module';
import { MethodModule } from 'src/services/method/method.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
      cache: true,
    }),
    // Kemudian modules lainnya
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 10,
      },
    ]),
    RedisModule,
    MethodModule,
    ProductModule,
    PassportModule.register({ defaultStrategy: 'google' }),
    AuthModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }