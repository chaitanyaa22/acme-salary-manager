import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { User } from '../../database/entities/user.entity.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Partial<Repository<User>>;
  let jwtService: Partial<JwtService>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'admin@acme.com',
    passwordHash: '',
    name: 'Admin User',
    role: UserRole.HR_ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Generate valid bcrypt hash for testing
    mockUser.passwordHash = await bcrypt.hash('admin123', 10);

    userRepository = {
      findOne: vi.fn(),
    };

    jwtService = {
      sign: vi.fn().mockReturnValue('mocked-jwt-token'),
    };

    service = new AuthService(
      userRepository as Repository<User>,
      jwtService as JwtService,
    );
  });

  describe('validateUser()', () => {
    it('should return user when email and password match', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(mockUser);

      const user = await service.validateUser('admin@acme.com', 'admin123');
      expect(user).toBeDefined();
      expect(user.id).toBe(mockUser.id);
      expect(user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when email not found', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@acme.com', 'admin123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(mockUser);

      await expect(
        service.validateUser('admin@acme.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should sanitize email (lowercase, trimmed)', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(mockUser);

      await service.validateUser('  ADMIN@acme.com ', 'admin123');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@acme.com' },
      });
    });
  });

  describe('login()', () => {
    it('should sign JWT token and return user profile', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(mockUser);

      const response = await service.login({
        email: 'admin@acme.com',
        password: 'admin123',
      });

      expect(response.accessToken).toBe('mocked-jwt-token');
      expect(response.user.id).toBe(mockUser.id);
      expect(response.user.email).toBe(mockUser.email);
      expect(response.user.role).toBe(UserRole.HR_ADMIN);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      });
    });
  });

  describe('getProfile()', () => {
    it('should return user profile without password hash', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(mockUser);

      const profile = await service.getProfile(mockUser.id);
      expect(profile).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect((profile as any).passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      vi.mocked(userRepository.findOne!).mockResolvedValue(null);

      await expect(service.getProfile('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hashPassword()', () => {
    it('should generate valid bcrypt hash', async () => {
      const hash = await service.hashPassword('newpassword');
      expect(hash).toBeDefined();
      expect(hash.startsWith('$2b$')).toBe(true);
      const isMatch = await bcrypt.compare('newpassword', hash);
      expect(isMatch).toBe(true);
    });
  });
});
