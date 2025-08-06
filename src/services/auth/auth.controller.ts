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
      const { token ,session} = await this.authService.createSession(user.id);
      this.redisService.setUserSession(token, {
        userId: session.user.id,
        username : user.username,
        role : session.user.roles
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
    const token = req.cookies?.access_token;
    if (!token) {
      return { user: null };
    }

    let session
    
    try {
      // Try to get session from Redis
      session = await this.redisService.getUserSession(token);
    } catch (redisError) {
      
      // If it's a JSON parsing error, try to debug and fix
      if (redisError.message.includes('not valid JSON')) {
        try {
          // Get raw data to see what's stored
          const rawData = await this.redisService.getRaw(`session:${token}`);
          
          // Delete corrupted session
          await this.redisService.deleteUserSession(token);
        } catch (debugError) {
          console.error('Error during debug:', debugError);
        }
      }
    }

    // If no session found in Redis or Redis failed, validate with auth service
    if (!session) {
      try {
        session = await this.authService.validateSession(token);
        
        // If validation successful, store back in Redis
        if (session) {
          await this.redisService.setUserSession(token, session, 3600);
          console.log('Session restored to Redis');
        }
      } catch (authError) {
        console.error('Auth validation error:', authError);
        return { user: null, error: 'Invalid session' };
      }
    }

    return { session };
  } catch (error) {
    console.error('General error in getCurrentUser:', error);
    return { user: null, error: 'Internal server error' };
  }
}

  
