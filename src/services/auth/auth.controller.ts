import { Controller, Get, Req, UseGuards, Res, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {
    // Guard akan redirect ke Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;
    
    // Buat session untuk user
    const { token } = await this.authService.createSession(user.id);
    
    // Set cookie dengan token
    
    
  return res.redirect('http://localhost:3000/dashboard');
    // Redirect ke frontend
  }

  @Post('logout')
  async logout(@Req() req, @Res() res: Response) {
    const token = req.cookies?.auth_token;
    
    if (token) {
      await this.authService.logout(token);
    }
    
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
  async getCurrentUser(@Req() req) {
    const token = req.cookies?.auth_token;
    
    if (!token) {
      return { user: null };
    }
    
    const user = await this.authService.validateSession(token);
    return { user };
  }

  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}