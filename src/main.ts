import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);


  // Cookie parser untuk session management
  app.use(cookieParser());

  // CORS configuration untuk OAuth
  app.enableCors({
    origin: [
      'http://localhost:3001', // Frontend development
      'http://localhost:3000', // Same origin
      configService.get('FRONTEND_URL') || 'http://localhost:3001',
      // Production domains
      configService.get('PRODUCTION_FRONTEND_URL'),
    ].filter(Boolean),
    credentials: true, // Important untuk cookies
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

  // Global interceptors (kamu sudah ada)
  app.useGlobalInterceptors(
    new ErrorInterceptor(),
    new ResponseInterceptor(),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties yang tidak ada di DTO
      forbidNonWhitelisted: true, // Throw error untuk unknown properties
      transform: true, // Auto-transform payloads ke DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert string ke number otomatis
      },
    }),
  );

  // Global prefix untuk API (optional)
  app.setGlobalPrefix('api/v1', {
    exclude: [
      'auth/google', // Exclude OAuth routes dari prefix
      'auth/google/callback',
      'health', // Health check endpoint
    ],
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3000;
  const environment = configService.get('NODE_ENV') || 'development';

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Environment: ${environment}`);
  console.log(`🔐 Google OAuth: ${configService.get('GOOGLE_CLIENT_ID') ? '✅ Configured' : '❌ Not configured'}`);
  
  if (environment === 'development') {
    console.log(`📋 Prisma Studio: npx prisma studio`);
    console.log(`🔍 API Docs: http://localhost:${port}/api (if Swagger enabled)`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});