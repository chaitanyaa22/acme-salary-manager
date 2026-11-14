import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DataSource } from 'typeorm';
import { CurrencyService } from '../currency/currency.service.js';

export interface CurrencyBreakdown {
  currency: string;
  headcount: number;
  totalMinor: number;
  totalMajor: number;
  avgMinor: number;
  avgMajor: number;
}

export interface AnalyticsSummary {
  totalHeadcount: number;
  totalPayrollUsdMinor: number;
  totalPayrollUsdMajor: number;
  avgSalaryUsdMinor: number;
  avgSalaryUsdMajor: number;
  currencyBreakdown: CurrencyBreakdown[];
}

export interface CountryAnalytics {
  country: string;
  currency: string;
  headcount: number;
  totalUsdMinor: number;
  totalUsdMajor: number;
  avgUsdMinor: number;
  avgUsdMajor: number;
}

export interface DepartmentAnalytics {
  department: string;
  headcount: number;
  totalUsdMinor: number;
  totalUsdMajor: number;
  avgUsdMinor: number;
  avgUsdMajor: number;
}

export interface LevelAnalytics {
  level: string;
  headcount: number;
  totalUsdMinor: number;
  totalUsdMajor: number;
  avgUsdMinor: number;
  avgUsdMajor: number;
  minUsdMinor: number;
  maxUsdMinor: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly currencyService = new CurrencyService();

  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Returns high-level payroll commitments, headcount, and currency breakdowns (Cached).
   */
  async getSummary(): Promise<AnalyticsSummary> {
    const cacheKey = 'analytics:summary';
    const cached = await this.cacheManager.get<AnalyticsSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    // Single query for overall totals
    const overallRaw = await this.dataSource.query(`
      SELECT 
        COUNT(*)::int AS "totalHeadcount",
        COALESCE(SUM(base_salary_usd_minor), 0)::bigint AS "totalPayrollUsdMinor",
        COALESCE(AVG(base_salary_usd_minor), 0)::bigint AS "avgSalaryUsdMinor"
      FROM employees
      WHERE is_active = true;
    `);

    // Currency breakdown query
    const currencyRaw = await this.dataSource.query(`
      SELECT 
        currency,
        COUNT(*)::int AS "headcount",
        COALESCE(SUM(base_salary_minor), 0)::bigint AS "totalMinor",
        COALESCE(AVG(base_salary_minor), 0)::bigint AS "avgMinor"
      FROM employees
      WHERE is_active = true
      GROUP BY currency
      ORDER BY "headcount" DESC;
    `);

    const totalHeadcount = Number(overallRaw[0]?.totalHeadcount ?? 0);
    const totalPayrollUsdMinor = Number(overallRaw[0]?.totalPayrollUsdMinor ?? 0);
    const avgSalaryUsdMinor = Number(overallRaw[0]?.avgSalaryUsdMinor ?? 0);

    const currencyBreakdown: CurrencyBreakdown[] = currencyRaw.map((row: any) => {
      const totalMinor = Number(row.totalMinor);
      const avgMinor = Number(row.avgMinor);
      return {
        currency: row.currency,
        headcount: Number(row.headcount),
        totalMinor,
        totalMajor: totalMinor / 100,
        avgMinor,
        avgMajor: avgMinor / 100,
      };
    });

    const result: AnalyticsSummary = {
      totalHeadcount,
      totalPayrollUsdMinor,
      totalPayrollUsdMajor: totalPayrollUsdMinor / 100,
      avgSalaryUsdMinor,
      avgSalaryUsdMajor: avgSalaryUsdMinor / 100,
      currencyBreakdown,
    };

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  /**
   * Returns compensation analytics aggregated by country (Cached).
   */
  async getByCountry(): Promise<CountryAnalytics[]> {
    const cacheKey = 'analytics:by-country';
    const cached = await this.cacheManager.get<CountryAnalytics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const raw = await this.dataSource.query(`
      SELECT 
        country,
        MODE() WITHIN GROUP (ORDER BY currency) AS "currency",
        COUNT(*)::int AS "headcount",
        COALESCE(SUM(base_salary_usd_minor), 0)::bigint AS "totalUsdMinor",
        COALESCE(AVG(base_salary_usd_minor), 0)::bigint AS "avgUsdMinor"
      FROM employees
      WHERE is_active = true
      GROUP BY country
      ORDER BY "totalUsdMinor" DESC;
    `);

    const result: CountryAnalytics[] = raw.map((r: any) => {
      const totalUsdMinor = Number(r.totalUsdMinor);
      const avgUsdMinor = Number(r.avgUsdMinor);
      return {
        country: r.country,
        currency: r.currency,
        headcount: Number(r.headcount),
        totalUsdMinor,
        totalUsdMajor: totalUsdMinor / 100,
        avgUsdMinor,
        avgUsdMajor: avgUsdMinor / 100,
      };
    });

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  /**
   * Returns compensation analytics aggregated by department (Cached).
   */
  async getByDepartment(): Promise<DepartmentAnalytics[]> {
    const cacheKey = 'analytics:by-department';
    const cached = await this.cacheManager.get<DepartmentAnalytics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const raw = await this.dataSource.query(`
      SELECT 
        department,
        COUNT(*)::int AS "headcount",
        COALESCE(SUM(base_salary_usd_minor), 0)::bigint AS "totalUsdMinor",
        COALESCE(AVG(base_salary_usd_minor), 0)::bigint AS "avgUsdMinor"
      FROM employees
      WHERE is_active = true
      GROUP BY department
      ORDER BY "totalUsdMinor" DESC;
    `);

    const result: DepartmentAnalytics[] = raw.map((r: any) => {
      const totalUsdMinor = Number(r.totalUsdMinor);
      const avgUsdMinor = Number(r.avgUsdMinor);
      return {
        department: r.department,
        headcount: Number(r.headcount),
        totalUsdMinor,
        totalUsdMajor: totalUsdMinor / 100,
        avgUsdMinor,
        avgUsdMajor: avgUsdMinor / 100,
      };
    });

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  /**
   * Returns compensation analytics grouped by job level (L1 - L6) (Cached).
   */
  async getByLevel(): Promise<LevelAnalytics[]> {
    const cacheKey = 'analytics:by-level';
    const cached = await this.cacheManager.get<LevelAnalytics[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const raw = await this.dataSource.query(`
      SELECT 
        level,
        COUNT(*)::int AS "headcount",
        COALESCE(SUM(base_salary_usd_minor), 0)::bigint AS "totalUsdMinor",
        COALESCE(AVG(base_salary_usd_minor), 0)::bigint AS "avgUsdMinor",
        COALESCE(MIN(base_salary_usd_minor), 0)::bigint AS "minUsdMinor",
        COALESCE(MAX(base_salary_usd_minor), 0)::bigint AS "maxUsdMinor"
      FROM employees
      WHERE is_active = true
      GROUP BY level
      ORDER BY level ASC;
    `);

    const result: LevelAnalytics[] = raw.map((r: any) => {
      const totalUsdMinor = Number(r.totalUsdMinor);
      const avgUsdMinor = Number(r.avgUsdMinor);
      return {
        level: r.level,
        headcount: Number(r.headcount),
        totalUsdMinor,
        totalUsdMajor: totalUsdMinor / 100,
        avgUsdMinor,
        avgUsdMajor: avgUsdMinor / 100,
        minUsdMinor: Number(r.minUsdMinor),
        maxUsdMinor: Number(r.maxUsdMinor),
      };
    });

    await this.cacheManager.set(cacheKey, result, 60000);
    return result;
  }

  /**
   * Invalidates all analytics cache keys upon salary mutation (ADR-03).
   */
  async invalidateCache(): Promise<void> {
    this.logger.log('Invalidating analytics cache keys due to salary mutation...');
    await Promise.all([
      this.cacheManager.del('analytics:summary'),
      this.cacheManager.del('analytics:by-country'),
      this.cacheManager.del('analytics:by-department'),
      this.cacheManager.del('analytics:by-level'),
    ]);
  }
}
