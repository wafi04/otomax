import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
   
  controllers: [AuthController],
  providers: [GoogleStrategy,AuthService,PrismaService,JwtService],
})
export class AuthModule {}
