import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/lib/redis/redis.service';
import { generateRandomId } from 'src/utils/generateRandomId';

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
    private  redisService: RedisService,
  ) {}

  private async linkGoogleAccount(googleUser: GoogleUser) {
    try {
      const user = await this.prisma.user.update({
        where: { email: googleUser.email },
        data: {
          googleId: googleUser.googleId,
          name: googleUser.name,
          picture: googleUser.picture,
        },
      });

      return user;
    } catch (error) {
      throw new Error('Unable to link Google account with existing user');
    }
  }

  async validateGoogleUser(googleUser: GoogleUser) {

    try {
      const username = this.generateUsernameOptimized(googleUser.email);

      const user = await this.prisma.user.upsert({
        where: {
          googleId: googleUser.googleId,
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
          roles: 'member',
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
        },
      });

      return user;
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return await this.linkGoogleAccount(googleUser);
      }
      throw error;
    }
  }


  private generateUsernameOptimized(email: string): string {
    const baseUsername = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseUsername}${randomSuffix}`;
  }



async createSession(userId: string) {
  return await this.prisma.$transaction(async (tx) => {
    try {
      const sessionId = generateRandomId("SESSION");
      
      const payload = { sub: userId, sessionId };

      const token = this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.accessToken.secret'),
        expiresIn: '7d',
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const session = await tx.session.create({
        data: {
          id: sessionId,
          userId: userId,
          token: token,
          expiresAt: expiresAt,
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              roles: true,
            },
          },
        },
      });

      await this.redisService.setTokenMapping(token, userId, 604800);

      return { 
        token, 
        sessionId,
        user: session.user 
      };

    } catch (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  });
}
  async validateSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await this.prisma.session.delete({
          where: { id: session.id },
        });
      }
      return null;
    }

    return session.user;
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
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
      },
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
      },
    });
  }



  // Helper untuk check roles
  hasRole(user: any, role: string): boolean {
    return user.roles.includes(role);
  }

  isAdmin(user: any): boolean {
    return this.hasRole(user, 'admin');
  }
}
