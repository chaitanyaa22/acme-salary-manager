import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
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

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSalary()', () => {
    it('should execute inside transaction, recalculate USD, record history, and invalidate cache', async () => {
      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue({ ...mockEmployee }),
        create: vi.fn().mockImplementation((_, data) => data),
        save: vi.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const updated = await service.updateSalary(
        'emp-uuid-1',
        {
          newSalaryMinor: 14000000,
          effectiveDate: '2026-11-15',
          reason: 'Promotion to Staff',
        },
        'admin@acme.com',
      );

      expect(updated.baseSalaryMinor).toBe(14000000);
      expect(updated.baseSalaryUsdMinor).toBe(14000000);

      // Verify SalaryHistory creation
      expect(mockManager.create).toHaveBeenCalledWith(
        SalaryHistory,
        expect.objectContaining({
          employeeId: 'emp-uuid-1',
          previousSalaryMinor: 12500000,
          newSalaryMinor: 14000000,
          reason: 'Promotion to Staff',
          changedBy: 'admin@acme.com',
        }),
      );

      // Verify cache invalidation
      expect(analyticsService.invalidateCache).toHaveBeenCalled();
    });

    it('should correctly normalize foreign currency to USD minor on salary update', async () => {
      const gbpEmployee: Employee = {
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
      // 60,000 * 1.28 = 76,800 USD -> 7,680,000 cents
      expect(updated.baseSalaryUsdMinor).toBe(7680000);
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
