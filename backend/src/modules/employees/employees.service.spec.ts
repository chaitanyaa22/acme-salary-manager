import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { EmployeesService } from './employees.service.js';
import { Employee } from '../../database/entities/employee.entity.js';
import { SalaryHistory } from '../../database/entities/salary-history.entity.js';
import { Currency } from '../../common/enums/currency.enum.js';
import { CurrencyService } from '../currency/currency.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let employeeRepo: Partial<Repository<Employee>>;
  let salaryHistoryRepo: Partial<Repository<SalaryHistory>>;
  let dataSource: Partial<DataSource>;
  let currencyService: CurrencyService;
  let analyticsService: Partial<AnalyticsService>;

  const mockEmployee: Employee = {
    id: 'emp-uuid-1',
    employeeId: 'ACM-00001',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe.1@acme.com',
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

  beforeEach(() => {
    currencyService = new CurrencyService();

    employeeRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    salaryHistoryRepo = {
      find: vi.fn(),
    };

    analyticsService = {
      invalidateCache: vi.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: vi.fn(),
    };

    service = new EmployeesService(
      employeeRepo as Repository<Employee>,
      salaryHistoryRepo as Repository<SalaryHistory>,
      dataSource as DataSource,
      currencyService,
      analyticsService as AnalyticsService,
    );
  });

  describe('findAll()', () => {
    it('should return paginated employee list with calculated metadata', async () => {
      const qbMock: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockEmployee], 100]),
      };

      vi.mocked(employeeRepo.createQueryBuilder!).mockReturnValue(qbMock);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        search: 'Jane',
        department: 'Engineering',
        sortBy: 'employeeId',
        sortOrder: 'ASC',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].employeeId).toBe('ACM-00001');
      expect(result.meta).toEqual({
        total: 100,
        page: 1,
        limit: 20,
        totalPages: 5,
      });

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        'emp.department = :department',
        { department: 'Engineering' },
      );
      expect(qbMock.andWhere).toHaveBeenCalledWith(
        '(LOWER(CONCAT(emp.firstName, \' \', emp.lastName)) LIKE :term OR LOWER(CONCAT(emp.lastName, \' \', emp.firstName)) LIKE :term OR LOWER(emp.firstName) LIKE :term OR LOWER(emp.lastName) LIKE :term OR LOWER(emp.email) LIKE :term OR LOWER(emp.employeeId) LIKE :term)',
        { term: '%jane%' },
      );
    });

    it('should support full name search with space normalization', async () => {
      const qbMock: any = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[mockEmployee], 1]),
      };

      vi.mocked(employeeRepo.createQueryBuilder!).mockReturnValue(qbMock);

      await service.findAll({
        page: 1,
        limit: 10,
        search: '  Jane   Doe  ',
        sortBy: 'employeeId',
        sortOrder: 'ASC',
      });

      expect(qbMock.andWhere).toHaveBeenCalledWith(
        '(LOWER(CONCAT(emp.firstName, \' \', emp.lastName)) LIKE :term OR LOWER(CONCAT(emp.lastName, \' \', emp.firstName)) LIKE :term OR LOWER(emp.firstName) LIKE :term OR LOWER(emp.lastName) LIKE :term OR LOWER(emp.email) LIKE :term OR LOWER(emp.employeeId) LIKE :term)',
        { term: '%jane doe%' },
      );
    });
  });

  describe('findById()', () => {
    it('should return employee if found', async () => {
      vi.mocked(employeeRepo.findOne!).mockResolvedValue(mockEmployee);

      const result = await service.findById('emp-uuid-1');
      expect(result.id).toBe('emp-uuid-1');
      expect(result.employeeId).toBe('ACM-00001');
    });

    it('should throw NotFoundException if employee not found', async () => {
      vi.mocked(employeeRepo.findOne!).mockResolvedValue(null);

      await expect(service.findById('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSalary()', () => {
    it('should atomically update base salary and record audit history inside transaction', async () => {
      const gbpEmployee = {
        ...mockEmployee,
        currency: Currency.GBP,
        baseSalaryMinor: 5000000, // 50k GBP
        baseSalaryUsdMinor: 6400000, // 50k * 1.28
      };

      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue({ ...gbpEmployee }),
        create: vi.fn().mockImplementation((_, data) => data),
        save: vi.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const updated = await service.updateSalary(
        'emp-uuid-1',
        {
          newSalaryMinor: 6000000, // 60k GBP
          effectiveDate: '2026-11-15',
          reason: 'Merit increase',
        },
        'admin@acme.com',
      );

      expect(updated.baseSalaryMinor).toBe(6000000);
      expect(updated.baseSalaryUsdMinor).toBe(7680000);
      expect(analyticsService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw BadRequestException if new salary is identical to current salary', async () => {
      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue({ ...mockEmployee }),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      await expect(
        service.updateSalary(
          'emp-uuid-1',
          {
            newSalaryMinor: 12500000, // same as current
            effectiveDate: '2026-11-15',
            reason: 'Identical salary',
          },
          'admin@acme.com',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createEmployee()', () => {
    it('should onboard new employee, generate sequential employeeId, and record initial salary history', async () => {
      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue(null), // no collision
        count: vi.fn().mockResolvedValue(42),
        create: vi.fn().mockImplementation((_, data) => ({ id: 'new-emp-uuid', ...data })),
        save: vi.fn().mockImplementation((_, data) => Promise.resolve(data)),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const newEmp = await service.createEmployee(
        {
          firstName: 'Sarah',
          lastName: 'Connor',
          email: 'sarah.connor@acme.com',
          country: 'United States',
          department: 'Engineering',
          level: 'L4',
          jobTitle: 'Staff Software Engineer',
          currency: Currency.USD,
          baseSalaryMinor: 14500000,
          hireDate: '2026-11-14',
        },
        'admin@acme.com',
      );

      expect(newEmp.employeeId).toBe('ACM-00043');
      expect(newEmp.firstName).toBe('Sarah');
      expect(newEmp.baseSalaryMinor).toBe(14500000);
      expect(newEmp.baseSalaryUsdMinor).toBe(14500000);
      expect(newEmp.isActive).toBe(true);

      expect(mockManager.save).toHaveBeenCalledTimes(2);
      expect(analyticsService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue(mockEmployee), // existing
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      await expect(
        service.createEmployee(
          {
            firstName: 'Duplicate',
            lastName: 'User',
            email: 'jane.doe@acme.com',
            country: 'United States',
            department: 'Engineering',
            level: 'L1',
            jobTitle: 'Engineer',
            currency: Currency.USD,
            baseSalaryMinor: 7000000,
            hireDate: '2026-11-14',
          },
          'admin@acme.com',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateEmployee()', () => {
    it('should soft-delete employee, record separation in salary history, and bust cache', async () => {
      const activeEmp = { ...mockEmployee, isActive: true };
      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue(activeEmp),
        create: vi.fn().mockImplementation((_, data) => data),
        save: vi.fn().mockImplementation((_, data) => Promise.resolve(data)),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const deactivated = await service.deactivateEmployee('emp-uuid-1', 'admin@acme.com');
      expect(deactivated.isActive).toBe(false);
      expect(analyticsService.invalidateCache).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException if employee is already deactivated', async () => {
      const alreadyDeactivated = { ...mockEmployee, isActive: false };
      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue(alreadyDeactivated),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      await expect(
        service.deactivateEmployee('emp-uuid-1', 'admin@acme.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSalaryHistory()', () => {
    it('should return chronological list of adjustments', async () => {
      vi.mocked(employeeRepo.findOne!).mockResolvedValue(mockEmployee);
      const mockHistory: any[] = [
        {
          id: 'hist-1',
          employeeId: 'emp-uuid-1',
          effectiveDate: '2026-11-15',
          previousSalaryMinor: 12500000,
          newSalaryMinor: 14000000,
        },
      ];
      vi.mocked(salaryHistoryRepo.find!).mockResolvedValue(mockHistory);

      const history = await service.getSalaryHistory('emp-uuid-1');
      expect(history).toHaveLength(1);
      expect(history[0].newSalaryMinor).toBe(14000000);
    });
  });
});
