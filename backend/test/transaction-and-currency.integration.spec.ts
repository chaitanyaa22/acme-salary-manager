import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { EmployeesService } from '../src/modules/employees/employees.service.js';
import { CurrencyService } from '../src/modules/currency/currency.service.js';
import { AnalyticsService } from '../src/modules/analytics/analytics.service.js';
import { Employee } from '../src/database/entities/employee.entity.js';
import { SalaryHistory } from '../src/database/entities/salary-history.entity.js';
import { Currency } from '../src/common/enums/currency.enum.js';

describe('Transactional Integrity & Currency Math Integration', () => {
  let service: EmployeesService;
  let dataSource: Partial<DataSource>;
  let currencyService: CurrencyService;
  let analyticsService: Partial<AnalyticsService>;

  beforeEach(() => {
    currencyService = new CurrencyService();
    analyticsService = {
      invalidateCache: vi.fn().mockResolvedValue(undefined),
    };
    dataSource = {
      transaction: vi.fn(),
    };

    service = new EmployeesService(
      {} as any,
      {} as any,
      dataSource as DataSource,
      currencyService,
      analyticsService as AnalyticsService,
    );
  });

  describe('Multi-Currency Precision during Salary Adjustments', () => {
    const testCases = [
      {
        country: 'India',
        currency: Currency.INR,
        currentMinor: 10_000_000, // 100k INR
        newMinor: 12_500_000,     // 125k INR
        expectedUsdMinor: 150_000, // 12.5M * 0.012 = 150k USD cents ($1,500.00)
      },
      {
        country: 'United Kingdom',
        currency: Currency.GBP,
        currentMinor: 5_000_000,  // 50k GBP
        newMinor: 6_000_000,      // 60k GBP
        expectedUsdMinor: 7_680_000, // 6M * 1.28 = 7.68M USD cents ($76,800.00)
      },
      {
        country: 'Germany',
        currency: Currency.EUR,
        currentMinor: 6_000_000,  // 60k EUR
        newMinor: 7_000_000,      // 70k EUR
        expectedUsdMinor: 7_560_000, // 7M * 1.08 = 7.56M USD cents ($75,600.00)
      },
      {
        country: 'Singapore',
        currency: Currency.SGD,
        currentMinor: 8_000_000,  // 80k SGD
        newMinor: 9_500_000,      // 95k SGD
        expectedUsdMinor: 7_030_000, // 9.5M * 0.74 = 7.03M USD cents ($70,300.00)
      },
      {
        country: 'United States',
        currency: Currency.USD,
        currentMinor: 12_000_000, // 120k USD
        newMinor: 13_500_000,     // 135k USD
        expectedUsdMinor: 13_500_000, // 1:1 identity
      },
    ];

    testCases.forEach(({ country, currency, currentMinor, newMinor, expectedUsdMinor }) => {
      it(`should accurately convert and normalize ${currency} (${country}) to USD minor`, async () => {
        const emp: Partial<Employee> = {
          id: 'emp-uuid',
          currency,
          baseSalaryMinor: currentMinor,
          baseSalaryUsdMinor: currencyService.toUsdMinor(currentMinor, currency),
        };

        const mockManager: any = {
          findOne: vi.fn().mockResolvedValue({ ...emp }),
          create: vi.fn().mockImplementation((_, data) => data),
          save: vi.fn().mockImplementation((_, data) => Promise.resolve(data)),
        };

        vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => cb(mockManager));

        const result = await service.updateSalary(
          'emp-uuid',
          {
            newSalaryMinor: newMinor,
            effectiveDate: '2026-11-15',
            reason: 'Market adjustment',
          },
          'admin@acme.com',
        );

        expect(result.baseSalaryMinor).toBe(newMinor);
        expect(result.baseSalaryUsdMinor).toBe(expectedUsdMinor);
        expect(Number.isInteger(result.baseSalaryUsdMinor)).toBe(true);
      });
    });
  });

  describe('Transactional Atomicity & Rollback Guarantee (ADR-04)', () => {
    it('should propagate error and abort transaction if SalaryHistory insertion fails', async () => {
      const emp: Partial<Employee> = {
        id: 'emp-uuid',
        currency: Currency.USD,
        baseSalaryMinor: 10000000,
        baseSalaryUsdMinor: 10000000,
      };

      const mockManager: any = {
        findOne: vi.fn().mockResolvedValue({ ...emp }),
        create: vi.fn().mockReturnValue({}),
        save: vi.fn().mockImplementation((entityClass) => {
          if (entityClass === SalaryHistory) {
            return Promise.reject(new Error('DB Constraint Violation'));
          }
          return Promise.resolve();
        }),
      };

      vi.mocked(dataSource.transaction!).mockImplementation(async (cb: any) => cb(mockManager));

      await expect(
        service.updateSalary(
          'emp-uuid',
          {
            newSalaryMinor: 12000000,
            effectiveDate: '2026-11-15',
            reason: 'Promotion',
          },
          'admin@acme.com',
        ),
      ).rejects.toThrow('DB Constraint Violation');

      // Cache must NOT be invalidated if transaction aborted
      expect(analyticsService.invalidateCache).not.toHaveBeenCalled();
    });
  });
});
