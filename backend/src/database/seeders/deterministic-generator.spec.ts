import { describe, it, expect } from 'vitest';
import {
  DeterministicGenerator,
  createPrng,
  COUNTRIES,
  DEPARTMENTS,
  LEVELS,
} from './deterministic-generator.js';
import { Currency } from '../../common/enums/currency.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { CurrencyService } from '../../modules/currency/currency.service.js';

describe('DeterministicGenerator', () => {
  const generator = new DeterministicGenerator();
  const currencyService = new CurrencyService();

  describe('createPrng()', () => {
    it('should generate identical random sequences when initialized with same seed', () => {
      const prng1 = createPrng(42);
      const prng2 = createPrng(42);

      const seq1 = Array.from({ length: 10 }, () => prng1());
      const seq2 = Array.from({ length: 10 }, () => prng2());

      expect(seq1).toEqual(seq2);
    });

    it('should generate numbers strictly between 0 and 1', () => {
      const prng = createPrng(99);
      for (let i = 0; i < 50; i++) {
        const val = prng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('generateDemoUsers()', () => {
    it('should generate demo admin and viewer accounts', () => {
      const users = generator.generateDemoUsers('hash-admin', 'hash-viewer');
      expect(users).toHaveLength(2);

      const admin = users.find((u) => u.email === 'admin@acme.com');
      const viewer = users.find((u) => u.email === 'viewer@acme.com');

      expect(admin).toBeDefined();
      expect(admin?.role).toBe(UserRole.HR_ADMIN);
      expect(admin?.passwordHash).toBe('hash-admin');

      expect(viewer).toBeDefined();
      expect(viewer?.role).toBe(UserRole.HR_VIEWER);
      expect(viewer?.passwordHash).toBe('hash-viewer');
    });
  });

  describe('generateEmployees()', () => {
    it('should generate exact requested count of employees', () => {
      const employees = generator.generateEmployees(150, 42);
      expect(employees).toHaveLength(150);
    });

    it('should produce 100% deterministic results across multiple runs with same seed', () => {
      const run1 = generator.generateEmployees(200, 42);
      const run2 = generator.generateEmployees(200, 42);

      expect(run1).toEqual(run2);
    });

    it('should distribute employees across all 5 countries and 8 departments', () => {
      const employees = generator.generateEmployees(500, 42);

      const countries = new Set(employees.map((e) => e.country));
      const departments = new Set(employees.map((e) => e.department));
      const levels = new Set(employees.map((e) => e.level));

      COUNTRIES.forEach((c) => expect(countries.has(c.name)).toBe(true));
      DEPARTMENTS.forEach((d) => expect(departments.has(d)).toBe(true));
      LEVELS.forEach((l) => expect(levels.has(l)).toBe(true));
    });

    it('should support cross-border compensation with exactly 20% (2,000 per 10k) having mismatched country and currency', () => {
      const employees = generator.generateEmployees(10000, 42);

      const nativeCurrencyMap: Record<string, Currency> = {
        'United States': Currency.USD,
        India: Currency.INR,
        'United Kingdom': Currency.GBP,
        Germany: Currency.EUR,
        Singapore: Currency.SGD,
      };

      const mismatched = employees.filter((emp) => emp.currency !== nativeCurrencyMap[emp.country!]);
      expect(mismatched).toHaveLength(2000);

      const matching = employees.filter((emp) => emp.currency === nativeCurrencyMap[emp.country!]);
      expect(matching).toHaveLength(8000);
    });

    it('should ensure all salaries are integer minor units with exact USD normalization', () => {
      const employees = generator.generateEmployees(100, 42);

      employees.forEach((emp) => {
        expect(Number.isInteger(emp.baseSalaryMinor)).toBe(true);
        expect(Number.isInteger(emp.baseSalaryUsdMinor)).toBe(true);
        expect(emp.baseSalaryMinor!).toBeGreaterThan(0);
        expect(emp.baseSalaryUsdMinor!).toBeGreaterThan(0);

        // Verification of normalized USD minor
        const expectedUsdMinor = currencyService.toUsdMinor(
          emp.baseSalaryMinor!,
          emp.currency!,
        );
        expect(emp.baseSalaryUsdMinor).toBe(expectedUsdMinor);
      });
    });

    it('should generate formatted sequential employee IDs (ACM-00001 format)', () => {
      const employees = generator.generateEmployees(10, 42);
      expect(employees[0].employeeId).toBe('ACM-00001');
      expect(employees[9].employeeId).toBe('ACM-00010');
    });
  });

  describe('generateSalaryHistories()', () => {
    it('should generate audit trail history records for employees', () => {
      const mockEmployees: any[] = [
        {
          id: 'emp-1',
          currency: Currency.USD,
          baseSalaryMinor: 12000000,
          baseSalaryUsdMinor: 12000000,
        },
        {
          id: 'emp-2',
          currency: Currency.EUR,
          baseSalaryMinor: 8000000,
          baseSalaryUsdMinor: 8640000,
        },
      ];

      const histories = generator.generateSalaryHistories(mockEmployees, 1.0, 42);
      expect(histories).toHaveLength(2);

      histories.forEach((h) => {
        expect(h.employeeId).toBeDefined();
        expect(h.previousSalaryMinor!).toBeLessThan(h.newSalaryMinor!);
        expect(h.previousSalaryUsdMinor!).toBeLessThan(h.newSalaryUsdMinor!);
        expect(h.reason).toBeDefined();
        expect(h.changedBy).toBe('admin@acme.com');
      });
    });
  });
});
