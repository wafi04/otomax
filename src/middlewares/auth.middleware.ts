import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies['wfdnstore'];

    if (!accessToken) {
            throw new UnauthorizedException("UNAUTHORIZED")
    }

    try {
      // Verifikasi access token
      const payload = this.jwtService.verify(accessToken, {
        secret: this.configService.get('jwt.accessToken.secret'),
      });
      req['user'] = payload;
      next();
    } catch (error) {
      throw new UnauthorizedException("UNAUTHORIZED")
    }
  }
}