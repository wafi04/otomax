import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies['wfdnstore'];

    if (!accessToken) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: this.configService.get('jwt.accessToken.secret'),
      });
      request['user'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
  }
}