import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
   imports : [
     JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET'); 
        return {
          secret: secret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
       }),
   ],
  controllers: [AuthController],
  providers: [GoogleStrategy,AuthService,PrismaService,JwtService],
})
export class AuthModule {}
