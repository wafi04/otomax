import { Controller, Get, Req, UseGuards, Res, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { RedisService } from 'src/lib/redis/redis.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const user = req.user;
      const { token } = await this.authService.createSession(user.id);

      this.redisService.setUserSession(token, {
        userId: user.userId,
        username : user.username,
        role : user.role
      },3600);

      res.cookie('wfdnstore', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect('http://localhost:3001');
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  @Post('logout')
  async logout(@Req() req, @Res() res: Response) {
    const token = req.cookies?.wfdnstore;

    if (token) {
      await this.authService.logout(token);
    }

    res.clearCookie('wfdnstore');
    res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
  async getCurrentUser(@Req() req) {
    const token = req.cookies?.wfdnstore;
    if (!token) {
      return { user: null };
    }
    
    let session = await this.redisService.getUserSession(token);
    if (!session) {
      session = await this.authService.validateSession(token);
    }
    return { session };
  }

  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}
