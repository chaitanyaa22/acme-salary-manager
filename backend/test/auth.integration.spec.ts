import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthController } from '../src/modules/auth/auth.controller.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { User } from '../src/database/entities/user.entity.js';
import { UserRole } from '../src/common/enums/user-role.enum.js';

describe('Auth Controller & Service Integration', () => {
  let controller: AuthController;
  let service: AuthService;
  let mockUser: User;
  let userRepository: Partial<Repository<User>>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('admin123', 10);
    mockUser = {
      id: '862fa7d1-bf32-4416-8f2e-0683a3118cf2',
      email: 'admin@acme.com',
      passwordHash,
      name: 'HR Administrator',
      role: UserRole.HR_ADMIN,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userRepository = {
      findOne: vi.fn().mockImplementation(({ where }) => {
        if (where.email === 'admin@acme.com' || where.id === mockUser.id) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
    };

    jwtService = new JwtService({
      secret: 'test-integration-secret-key',
      signOptions: { expiresIn: '1h' },
    });

    service = new AuthService(userRepository as Repository<User>, jwtService);
    controller = new AuthController(service);
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate valid credentials and return JWT accessToken with profile', async () => {
      const response = await controller.login({
        email: 'admin@acme.com',
        password: 'admin123',
      });

      expect(response).toHaveProperty('accessToken');
      expect(typeof response.accessToken).toBe('string');
      expect(response.user).toEqual({
        id: mockUser.id,
        email: 'admin@acme.com',
        name: 'HR Administrator',
        role: UserRole.HR_ADMIN,
      });

      // Verify token contains accurate payload
      const decoded: any = jwtService.verify(response.accessToken);
      expect(decoded.sub).toBe(mockUser.id);
      expect(decoded.email).toBe('admin@acme.com');
      expect(decoded.role).toBe(UserRole.HR_ADMIN);
    });

    it('should reject invalid password with UnauthorizedException', async () => {
      await expect(
        controller.login({
          email: 'admin@acme.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject non-existent email with UnauthorizedException', async () => {
      await expect(
        controller.login({
          email: 'unknown@acme.com',
          password: 'admin123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return profile for current user ID', async () => {
      const profile = await controller.getProfile(mockUser.id);

      expect(profile).toEqual({
        id: mockUser.id,
        email: 'admin@acme.com',
        name: 'HR Administrator',
        role: UserRole.HR_ADMIN,
      });
    });
  });
});
