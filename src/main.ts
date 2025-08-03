import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { requestTimingMiddleware } from './middlewares/request.middleware';
import { memoryUsageMiddleware } from './middlewares/memory.middleware';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(requestTimingMiddleware);
  app.use(memoryUsageMiddleware);
  
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:3001', 
      'http://localhost:3000',
    ].filter(Boolean),
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
    ],
  });

  // Import the new interceptors
  const { TimingInterceptor } = require('./common/interceptors/timing.interceptor');
  const { PerformanceInterceptor } = require('./common/interceptors/performance.interceptor');

  // Global interceptors with timing
  app.useGlobalInterceptors(
    new TimingInterceptor(),
    new PerformanceInterceptor(),
    new ErrorInterceptor(),
    new ResponseInterceptor(),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix untuk API
  app.setGlobalPrefix('api/v1', {
    exclude: [
      'auth/google',
      'auth/google/callback',
      'health',
    ],
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3000;
  const environment = configService.get('NODE_ENV') || 'development';

  await app.listen(port);


  if (environment === 'development') {
    logger.log(`📋 Prisma Studio: npx prisma studio`);
    logger.log(`🔍 API Docs: http://localhost:${port}/api (if Swagger enabled)`);
  }
  
  setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / 1024 / 1024 > 100) { 
      logger.warn(
        `⚠️  High memory usage detected: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`
      );
    }
  }, 60000);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('❌ Error starting server:', error);
  process.exit(1);
});