import { Currency } from '../../common/enums/currency.enum.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { CurrencyService } from '../../modules/currency/currency.service.js';
import { User } from '../entities/user.entity.js';
import { Employee } from '../entities/employee.entity.js';
import { SalaryHistory } from '../entities/salary-history.entity.js';

export interface CountryConfig {
  name: string;
  currency: Currency;
  // Level multiplier in local currency major units base
  levelSalariesMajor: Record<string, { min: number; max: number }>;
}

export const COUNTRIES: CountryConfig[] = [
  {
    name: 'United States',
    currency: Currency.USD,
    levelSalariesMajor: {
      L1: { min: 65000, max: 85000 },
      L2: { min: 85000, max: 115000 },
      L3: { min: 115000, max: 155000 },
      L4: { min: 155000, max: 205000 },
      L5: { min: 205000, max: 275000 },
      L6: { min: 275000, max: 380000 },
    },
  },
  {
    name: 'India',
    currency: Currency.INR,
    levelSalariesMajor: {
      L1: { min: 600000, max: 1000000 },
      L2: { min: 1000000, max: 1600000 },
      L3: { min: 1600000, max: 2600000 },
      L4: { min: 2600000, max: 4000000 },
      L5: { min: 4000000, max: 6500000 },
      L6: { min: 6500000, max: 11000000 },
    },
  },
  {
    name: 'United Kingdom',
    currency: Currency.GBP,
    levelSalariesMajor: {
      L1: { min: 35000, max: 45000 },
      L2: { min: 45000, max: 62000 },
      L3: { min: 62000, max: 85000 },
      L4: { min: 85000, max: 115000 },
      L5: { min: 115000, max: 155000 },
      L6: { min: 155000, max: 220000 },
    },
  },
  {
    name: 'Germany',
    currency: Currency.EUR,
    levelSalariesMajor: {
      L1: { min: 45000, max: 58000 },
      L2: { min: 58000, max: 75000 },
      L3: { min: 75000, max: 98000 },
      L4: { min: 98000, max: 130000 },
      L5: { min: 130000, max: 175000 },
      L6: { min: 175000, max: 245000 },
    },
  },
  {
    name: 'Singapore',
    currency: Currency.SGD,
    levelSalariesMajor: {
      L1: { min: 50000, max: 70000 },
      L2: { min: 70000, max: 95000 },
      L3: { min: 95000, max: 135000 },
      L4: { min: 135000, max: 185000 },
      L5: { min: 185000, max: 250000 },
      L6: { min: 250000, max: 350000 },
    },
  },
];

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
];

export const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

export const JOB_TITLES_BY_DEPT: Record<string, Record<string, string>> = {
  Engineering: {
    L1: 'Junior Software Engineer',
    L2: 'Software Engineer',
    L3: 'Senior Software Engineer',
    L4: 'Staff Software Engineer',
    L5: 'Principal Engineer',
    L6: 'VP of Engineering',
  },
  Product: {
    L1: 'Associate Product Manager',
    L2: 'Product Manager',
    L3: 'Senior Product Manager',
    L4: 'Lead Product Manager',
    L5: 'Director of Product',
    L6: 'VP of Product',
  },
  Design: {
    L1: 'Junior Product Designer',
    L2: 'Product Designer',
    L3: 'Senior Product Designer',
    L4: 'Staff Product Designer',
    L5: 'Design Director',
    L6: 'VP of Design',
  },
  Sales: {
    L1: 'Sales Development Rep',
    L2: 'Account Executive',
    L3: 'Senior Account Executive',
    L4: 'Enterprise Account Executive',
    L5: 'Sales Director',
    L6: 'VP of Global Sales',
  },
  Marketing: {
    L1: 'Marketing Specialist',
    L2: 'Marketing Manager',
    L3: 'Senior Marketing Manager',
    L4: 'Head of Growth Marketing',
    L5: 'Marketing Director',
    L6: 'Chief Marketing Officer',
  },
  'Human Resources': {
    L1: 'People Operations Coordinator',
    L2: 'HR Business Partner',
    L3: 'Senior HRBP',
    L4: 'Compensation & Benefits Lead',
    L5: 'Director of People',
    L6: 'Chief People Officer',
  },
  Finance: {
    L1: 'Financial Analyst',
    L2: 'Senior Financial Analyst',
    L3: 'Finance Manager',
    L4: 'Senior Finance Manager',
    L5: 'Director of FP&A',
    L6: 'VP of Finance',
  },
  Operations: {
    L1: 'Operations Coordinator',
    L2: 'Operations Specialist',
    L3: 'Senior Operations Manager',
    L4: 'Head of Business Operations',
    L5: 'Operations Director',
    L6: 'VP of Operations',
  },
};

const FIRST_NAMES = [
  'Aarav', 'Emma', 'Liam', 'Olivia', 'Noah', 'Sophia', 'Lucas', 'Mia', 'Oliver', 'Amelia',
  'Priya', 'Rohan', 'Ananya', 'Wei', 'Mei', 'Hiroshi', 'Elena', 'Mateo', 'Chloe', 'Alexander',
  'Vikram', 'Neha', 'Siddharth', 'Zoe', 'Benjamin', 'Charlotte', 'Daniel', 'Harper', 'James', 'Evelyn',
  'Aditi', 'Kavya', 'Arjun', 'Gabriel', 'Isabella', 'Julian', 'Layla', 'Leo', 'Nora', 'Sebastian',
];

const LAST_NAMES = [
  'Sharma', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Patel', 'Verma', 'Tan', 'Lim', 'Mueller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Taylor',
  'Kulkarni', 'Deshmukh', 'Wilson', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Lee',
  'Choudhury', 'Iyer', 'Nair', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
];

/**
 * Seedable Pseudo-Random Number Generator (Mulberry32).
 * Guarantees 100% deterministic outputs across environments and runs.
 */
export function createPrng(seed = 42): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class DeterministicGenerator {
  private readonly currencyService = new CurrencyService();

  /**
   * Generates demo administrator and viewer users.
   */
  generateDemoUsers(adminPasswordHash: string, viewerPasswordHash: string): Partial<User>[] {
    return [
      {
        email: 'admin@acme.com',
        name: 'HR Administrator',
        role: UserRole.HR_ADMIN,
        passwordHash: adminPasswordHash,
      },
      {
        email: 'viewer@acme.com',
        name: 'HR Viewer',
        role: UserRole.HR_VIEWER,
        passwordHash: viewerPasswordHash,
      },
    ];
  }

  /**
   * Generates exactly `count` deterministic employees across 5 countries, 8 departments, 6 levels.
   */
  generateEmployees(count = 10000, seed = 42): Partial<Employee>[] {
    const random = createPrng(seed);
    const employees: Partial<Employee>[] = [];

    const now = new Date('2026-11-01T00:00:00.000Z');

    for (let i = 1; i <= count; i++) {
      const countryConfig = COUNTRIES[Math.floor(random() * COUNTRIES.length)];
      const department = DEPARTMENTS[Math.floor(random() * DEPARTMENTS.length)];
      const level = LEVELS[Math.floor(random() * LEVELS.length)];
      const jobTitle = JOB_TITLES_BY_DEPT[department][level];

      const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
      const employeeId = `ACM-${i.toString().padStart(5, '0')}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${employeeId.toLowerCase()}@acme.com`;

      // Provision for cross-border compensation (exactly 20% of employees, or 2,000 out of 10,000)
      // where the employee resides in one country but is compensated in a different currency.
      let currency = countryConfig.currency;
      let salaryRangeConfig = countryConfig;

      if (i % 5 === 0) {
        const otherCountries = COUNTRIES.filter((c) => c.currency !== countryConfig.currency);
        const altIndex = Math.floor(random() * otherCountries.length);
        salaryRangeConfig = otherCountries[altIndex];
        currency = salaryRangeConfig.currency;
      }

      // Salary calculation in chosen currency major units, then converted to minor units
      const salaryRange = salaryRangeConfig.levelSalariesMajor[level];
      const salarySpread = salaryRange.max - salaryRange.min;
      const salaryMajor = Math.floor(salaryRange.min + random() * salarySpread);
      // Round to nearest 500 for clean compensation bands
      const roundedSalaryMajor = Math.round(salaryMajor / 500) * 500;
      const baseSalaryMinor = this.currencyService.toMinorUnits(roundedSalaryMajor);

      // Normalized USD minor units computed deterministically at seed time (ADR-02)
      const baseSalaryUsdMinor = this.currencyService.toUsdMinor(
        baseSalaryMinor,
        currency,
      );

      // Deterministic hire date within the past 5 years
      const daysAgo = Math.floor(random() * (5 * 365));
      const hireDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      employees.push({
        employeeId,
        firstName,
        lastName,
        email,
        country: countryConfig.name,
        department,
        level,
        jobTitle,
        currency,
        baseSalaryMinor,
        baseSalaryUsdMinor,
        hireDate,
        isActive: true,
      });
    }

    return employees;
  }

  /**
   * Generates initial audit trail (SalaryHistory) records for a subset of employees.
   */
  generateSalaryHistories(
    employees: Employee[],
    historyPercentage = 0.25,
    seed = 84,
  ): Partial<SalaryHistory>[] {
    const random = createPrng(seed);
    const histories: Partial<SalaryHistory>[] = [];

    const sampleSize = Math.floor(employees.length * historyPercentage);
    const step = Math.floor(employees.length / sampleSize);

    const reasons = [
      'Annual Merit Increase',
      'Promotion Adjustment',
      'Market Cost of Living Adjustment',
      'Performance Excellence Award',
      'Mid-Year Equity & Compensation Alignment',
    ];

    for (let i = 0; i < employees.length; i += step) {
      const emp = employees[i];
      if (!emp || !emp.id) continue;

      // Previous salary was 8% to 15% lower
      const increasePercentage = 0.08 + random() * 0.07;
      const previousMinor = Math.round(emp.baseSalaryMinor / (1 + increasePercentage));
      const previousUsdMinor = this.currencyService.toUsdMinor(previousMinor, emp.currency);

      const effectiveDate = new Date('2026-04-01T00:00:00.000Z')
        .toISOString()
        .split('T')[0];

      histories.push({
        employeeId: emp.id,
        previousSalaryMinor: previousMinor,
        newSalaryMinor: emp.baseSalaryMinor,
        previousSalaryUsdMinor: previousUsdMinor,
        newSalaryUsdMinor: emp.baseSalaryUsdMinor,
        currency: emp.currency,
        effectiveDate,
        reason: reasons[Math.floor(random() * reasons.length)],
        changedBy: 'admin@acme.com',
      });
    }

    return histories;
  }
}
