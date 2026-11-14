import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { UserRole } from '../enums/user-role.enum.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Partial<Reflector>;

  const createMockContext = (user?: any): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RolesGuard(reflector as Reflector);
  });

  it('should allow access if no roles are required on route', () => {
    vi.mocked(reflector.getAllAndOverride!).mockReturnValue(null);
    const context = createMockContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role (HR_ADMIN)', () => {
    vi.mocked(reflector.getAllAndOverride!).mockReturnValue([UserRole.HR_ADMIN]);
    const context = createMockContext({
      id: 'user-1',
      role: UserRole.HR_ADMIN,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has one of multiple allowed roles', () => {
    vi.mocked(reflector.getAllAndOverride!).mockReturnValue([
      UserRole.HR_ADMIN,
      UserRole.HR_VIEWER,
    ]);
    const context = createMockContext({
      id: 'user-2',
      role: UserRole.HR_VIEWER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has insufficient role (HR_VIEWER on HR_ADMIN route)', () => {
    vi.mocked(reflector.getAllAndOverride!).mockReturnValue([UserRole.HR_ADMIN]);
    const context = createMockContext({
      id: 'user-3',
      role: UserRole.HR_VIEWER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if request has no user object', () => {
    vi.mocked(reflector.getAllAndOverride!).mockReturnValue([UserRole.HR_ADMIN]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
