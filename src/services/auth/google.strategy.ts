import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://ea2ec5624d2c.ngrok-free.app/auth/google/callback",
      scope: ['email', 'profile'],
    });

    // Debug log untuk memastikan env variables
    this.logger.log('Google Strategy initialized');
    this.logger.log(`Client ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
    this.logger.log(`Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.log('Google OAuth validate called');
      this.logger.log(`Profile ID: ${profile.id}`);
      this.logger.log(`Profile Email: ${profile.emails?.[0]?.value}`);
      this.logger.log(`Profile Name: ${profile.displayName}`);

      // Pastikan profile data lengkap
      if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
        this.logger.error('No email found in Google profile');
        return done(new Error('No email found in Google profile'), null);
      }

      const user = await this.authService.validateGoogleUser({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName || profile.name?.givenName || 'Unknown',
        picture: profile.photos?.[0]?.value,
      });

      this.logger.log('User validated successfully:', user.id);
      done(null, user);
    } catch (error) {
      this.logger.error('Error in Google Strategy validate:', error);
      done(error, null);
    }
  }
}
