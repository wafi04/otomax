// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

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
  ) {}

  async validateGoogleUser(googleUser: GoogleUser) {
    // Cek apakah user sudah ada berdasarkan googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId }
    });

    if (!user) {
      // Cek apakah email sudah terdaftar
      const existingUser = await this.prisma.user.findUnique({
        where: { email: googleUser.email }
      });

      if (existingUser) {
        // Update existing user dengan Google ID
        user = await this.prisma.user.update({
          where: { email: googleUser.email },
          data: {
            googleId: googleUser.googleId,
            name: googleUser.name,
            picture: googleUser.picture,
          }
        });
      } else {
        // Generate username dari email
        const username = this.generateUsername(googleUser.email);
        
        // Buat user baru
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            username: username,
            picture: googleUser.picture,
            googleId: googleUser.googleId,
            roles: 'user', // default role
          }
        });
      }
    }

    return user;
  }

  async createSession(userId: string) {
    // Buat JWT token
    const payload = { sub: userId };
    const token = this.jwtService.sign(payload);
    
    // Simpan session ke database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 hari

    const session = await this.prisma.session.create({
      data: {
        userId: userId,
        token: token,
        expiresAt: expiresAt,
      }
    });

    return { token, session };
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
