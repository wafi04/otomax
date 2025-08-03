// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,

  ) { }

  private async linkGoogleAccount(googleUser: GoogleUser) {
    try {
      const user = await this.prisma.user.update({
        where: { email: googleUser.email },
        data: {
          googleId: googleUser.googleId,
          name: googleUser.name,
          picture: googleUser.picture,
        }
      });

      return user;
    } catch (error) {
      throw new Error('Unable to link Google account with existing user');
    }
  }

  async validateGoogleUser(googleUser: GoogleUser) {
    const startTime = Date.now();

    try {
      // Generate username dari email
      const username = this.generateUsernameOptimized(googleUser.email);

      // Use upsert untuk create atau update
      const user = await this.prisma.user.upsert({
        where: {
          googleId: googleUser.googleId
        },
        update: {
          name: googleUser.name,
          picture: googleUser.picture,
        },
        create: {
          email: googleUser.email,
          name: googleUser.name,
          username: username,
          picture: googleUser.picture,
          googleId: googleUser.googleId,
          roles: 'user',
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          picture: true,
          googleId: true,
          roles: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      const duration = Date.now() - startTime;
      return user;

    } catch (error) {
      // Handle unique constraint violation for email
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        // Email already exists, try to link the accounts
        return await this.linkGoogleAccount(googleUser);
      }

      const duration = Date.now() - startTime;
      throw error
    }
  }
  // Optimized username generation
  private generateUsernameOptimized(email: string): string {
    const baseUsername = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Add random suffix to avoid collisions
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseUsername}${randomSuffix}`;
  }

  async createSession(userId: string) {
    try {
      const payload = { sub: userId };
      const token = this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.accessToken.secret'),
      });

      // Simpan session ke database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const session = await this.prisma.session.create({
        data: {
          userId: userId,
          token: token,
          expiresAt: expiresAt,
        }
      });

      return { token, session };
    } catch (error) {
      throw new Error('Failed to create session');
    }
  }
  async validateSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        // Hapus session yang expired
        await this.prisma.session.delete({
          where: { id: session.id }
        });
      }
      return null;
    }

    return session.user;
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({
      where: { token }
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        picture: true,
        roles: true,
        createdAt: true,
      }
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        picture: true,
        roles: true,
        createdAt: true,
      }
    });
  }

  private generateUsername(email: string): string {
    const baseUsername = email.split('@')[0];
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}${randomSuffix}`;
  }

  // Helper untuk check roles
  hasRole(user: any, role: string): boolean {
    return user.roles.includes(role);
  }

  isAdmin(user: any): boolean {
    return this.hasRole(user, 'admin');
  }
}
