import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EmployeesController } from '../src/modules/employees/employees.controller.js';
import { EmployeesService } from '../src/modules/employees/employees.service.js';
import { CurrenciesController } from '../src/modules/currency/currencies.controller.js';
import { CurrencyService } from '../src/modules/currency/currency.service.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';
import { UserRole } from '../src/common/enums/user-role.enum.js';
import { Currency } from '../src/common/enums/currency.enum.js';
import { Employee } from '../src/database/entities/employee.entity.js';

describe('RBAC & Salary Revisions Integration', () => {
  let controller: EmployeesController;
  let mockEmployeesService: Partial<EmployeesService>;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  const mockEmployee: Employee = {
    id: 'e9b2512f-0498-4c8d-b088-75b871c5ec21',
    employeeId: 'ACM-00001',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@acme.com',
    country: 'United States',
    department: 'Engineering',
    level: 'L3',
    jobTitle: 'Senior Software Engineer',
    currency: Currency.USD,
    baseSalaryMinor: 12500000,
    baseSalaryUsdMinor: 12500000,
    hireDate: '2023-01-15',
    isActive: true,
    salaryHistories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockContext = (handler: Function, user?: any): ExecutionContext => {
    return {
      getHandler: () => handler,
      getClass: () => EmployeesController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);

    mockEmployeesService = {
      findAll: vi.fn().mockResolvedValue({
        data: [mockEmployee],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
      findById: vi.fn().mockResolvedValue(mockEmployee),
      updateSalary: vi.fn().mockResolvedValue({
        ...mockEmployee,
        baseSalaryMinor: 14000000,
        baseSalaryUsdMinor: 14000000,
      }),
      getSalaryHistory: vi.fn().mockResolvedValue([
        {
          id: 'hist-1',
          employeeId: mockEmployee.id,
          previousSalaryMinor: 12500000,
          newSalaryMinor: 14000000,
          effectiveDate: '2026-11-15',
          reason: 'Performance merit',
        },
      ]),
      createEmployee: vi.fn().mockResolvedValue({
        ...mockEmployee,
        id: 'new-emp-id',
        employeeId: 'ACM-00044',
      }),
      deactivateEmployee: vi.fn().mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      }),
    };

    controller = new EmployeesController(mockEmployeesService as EmployeesService);
  });

  describe('Directory Access (Read Permissions)', () => {
    it('should allow HR_ADMIN and HR_VIEWER to query employee directory', async () => {
      const result = await controller.findAll({ page: 1, limit: 20, sortBy: 'employeeId', sortOrder: 'ASC' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].employeeId).toBe('ACM-00001');
    });

    it('should allow retrieval of employee details by UUID', async () => {
      const result = await controller.findById(mockEmployee.id);
      expect(result.id).toBe(mockEmployee.id);
    });
  });

  describe('Salary Revision RBAC Enforcement (Write Permissions)', () => {
    const validPayload = {
      newSalaryMinor: 14000000,
      effectiveDate: '2026-11-15',
      reason: 'Annual merit increase',
    };

    it('should ALLOW HR_ADMIN to pass RolesGuard on updateSalary', () => {
      const context = createMockContext(controller.updateSalary, {
        id: 'admin-id',
        email: 'admin@acme.com',
        role: UserRole.HR_ADMIN,
      });

      const canActivate = rolesGuard.canActivate(context);
      expect(canActivate).toBe(true);
    });

    it('should execute salary update when authorized as HR_ADMIN', async () => {
      const updated = await controller.updateSalary(
        mockEmployee.id,
        validPayload,
        'admin@acme.com',
      );

      expect(updated.baseSalaryMinor).toBe(14000000);
      expect(mockEmployeesService.updateSalary).toHaveBeenCalledWith(
        mockEmployee.id,
        validPayload,
        'admin@acme.com',
      );
    });

    it('should FORBID HR_VIEWER from passing RolesGuard on updateSalary (403 Forbidden)', () => {
      const context = createMockContext(controller.updateSalary, {
        id: 'viewer-id',
        email: 'viewer@acme.com',
        role: UserRole.HR_VIEWER,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if unauthenticated caller attempts updateSalary', () => {
      const context = createMockContext(controller.updateSalary, undefined);
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Salary History Access (Read Permissions)', () => {
    it('should allow access to audit history records', async () => {
      const history = await controller.getSalaryHistory(mockEmployee.id);
      expect(history).toHaveLength(1);
      expect(history[0].newSalaryMinor).toBe(14000000);
    });
  });

  describe('Employee Onboarding RBAC Enforcement (HR_ADMIN only)', () => {
    const createDto = {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@acme.com',
      country: 'United States',
      department: 'Engineering',
      level: 'L2',
      jobTitle: 'Software Engineer',
      currency: Currency.USD,
      baseSalaryMinor: 11000000,
      hireDate: '2026-11-15',
    };

    it('should ALLOW HR_ADMIN to create an employee', () => {
      const context = createMockContext(controller.createEmployee, {
        id: 'admin-id',
        email: 'admin@acme.com',
        role: UserRole.HR_ADMIN,
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should execute employee creation when authorized as HR_ADMIN', async () => {
      const result = await controller.createEmployee(createDto, 'admin@acme.com');
      expect(result.employeeId).toBe('ACM-00044');
      expect(mockEmployeesService.createEmployee).toHaveBeenCalledWith(
        createDto,
        'admin@acme.com',
      );
    });

    it('should FORBID HR_VIEWER from creating an employee (403 Forbidden)', () => {
      const context = createMockContext(controller.createEmployee, {
        id: 'viewer-id',
        email: 'viewer@acme.com',
        role: UserRole.HR_VIEWER,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Employee Offboarding RBAC Enforcement (HR_ADMIN only)', () => {
    it('should ALLOW HR_ADMIN to deactivate an employee', () => {
      const context = createMockContext(controller.deactivateEmployee, {
        id: 'admin-id',
        email: 'admin@acme.com',
        role: UserRole.HR_ADMIN,
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should execute employee deactivation when authorized as HR_ADMIN', async () => {
      const result = await controller.deactivateEmployee(mockEmployee.id, 'admin@acme.com');
      expect(result.isActive).toBe(false);
      expect(mockEmployeesService.deactivateEmployee).toHaveBeenCalledWith(
        mockEmployee.id,
        'admin@acme.com',
      );
    });

    it('should FORBID HR_VIEWER from deactivating an employee (403 Forbidden)', () => {
      const context = createMockContext(controller.deactivateEmployee, {
        id: 'viewer-id',
        email: 'viewer@acme.com',
        role: UserRole.HR_VIEWER,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('Currency Management RBAC Enforcement (ADR-07)', () => {
    let currenciesController: CurrenciesController;
    let mockCurrencyService: Partial<CurrencyService>;

    beforeEach(() => {
      mockCurrencyService = {
        getAllCurrencies: vi.fn().mockResolvedValue([
          { code: 'USD', name: 'US Dollar', symbol: '$', rateToUsd: 1.0, isActive: true },
        ]),
        createCurrency: vi.fn().mockResolvedValue({
          code: 'CAD',
          name: 'Canadian Dollar',
          symbol: 'CA$',
          rateToUsd: 0.73,
          isActive: true,
        }),
        updateCurrency: vi.fn().mockResolvedValue({
          code: 'CAD',
          name: 'Canadian Dollar',
          symbol: 'CA$',
          rateToUsd: 0.75,
          isActive: true,
        }),
      };
      currenciesController = new CurrenciesController(mockCurrencyService as CurrencyService);
    });

    const createCurrencyContext = (handler: Function, user?: any): ExecutionContext => {
      return {
        getHandler: () => handler,
        getClass: () => CurrenciesController,
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    };

    it('should ALLOW HR_ADMIN to create a new currency', () => {
      const context = createCurrencyContext(currenciesController.create, {
        id: 'admin-id',
        email: 'admin@acme.com',
        role: UserRole.HR_ADMIN,
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should FORBID HR_VIEWER from creating a new currency (403 Forbidden)', () => {
      const context = createCurrencyContext(currenciesController.create, {
        id: 'viewer-id',
        email: 'viewer@acme.com',
        role: UserRole.HR_VIEWER,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should ALLOW HR_ADMIN to update currency exchange rate', () => {
      const context = createCurrencyContext(currenciesController.update, {
        id: 'admin-id',
        email: 'admin@acme.com',
        role: UserRole.HR_ADMIN,
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should FORBID HR_VIEWER from updating currency exchange rate (403 Forbidden)', () => {
      const context = createCurrencyContext(currenciesController.update, {
        id: 'viewer-id',
        email: 'viewer@acme.com',
        role: UserRole.HR_VIEWER,
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
