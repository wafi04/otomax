// google.strategy.ts
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
      callbackURL: "http://localhost:3000/auth/google/callback",
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      let email = null;
      
      // Coba berbagai cara untuk mendapatkan email
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        email = profile.emails[0].value;
      } else if (profile._json && profile._json.email) {
        email = profile._json.email;
      } else if (profile.email) {
        email = profile.email;
      }

      if (!email) {
        done(new Error('No email found in Google profile'), null);
        return;
      }

      this.logger.log(`Found email: ${email}`);

      const user = await this.authService.validateGoogleUser({
        googleId: profile.id,
        email: email,
        name: profile.displayName || profile.name?.givenName || 'Unknown',
        picture: profile.photos?.[0]?.value,
      });

      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
