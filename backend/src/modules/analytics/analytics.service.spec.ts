import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataSource } from 'typeorm';
import type { Cache } from 'cache-manager';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let dataSource: Partial<DataSource>;
  let cacheManager: Partial<Cache>;

  beforeEach(() => {
    cacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    dataSource = {
      query: vi.fn(),
    };

    service = new AnalyticsService(
      dataSource as DataSource,
      cacheManager as Cache,
    );
  });

  describe('getSummary()', () => {
    it('should return cached summary if available without executing SQL', async () => {
      const mockCached = {
        totalHeadcount: 10000,
        totalPayrollUsdMinor: 100000000000,
        totalPayrollUsdMajor: 1000000000,
        avgSalaryUsdMinor: 10000000,
        avgSalaryUsdMajor: 100000,
        currencyBreakdown: [],
      };

      vi.mocked(cacheManager.get!).mockResolvedValue(mockCached);

      const result = await service.getSummary();
      expect(result).toEqual(mockCached);
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it('should execute SQL aggregations and store result in cache when cache is empty', async () => {
      vi.mocked(cacheManager.get!).mockResolvedValue(null);

      vi.mocked(dataSource.query!)
        .mockResolvedValueOnce([
          {
            totalHeadcount: 10000,
            totalPayrollUsdMinor: '100000000000',
            avgSalaryUsdMinor: '10000000',
          },
        ])
        .mockResolvedValueOnce([
          {
            currency: 'USD',
            headcount: 2000,
            totalMinor: '25000000000',
            avgMinor: '12500000',
          },
        ]);

      const result = await service.getSummary();

      expect(result.totalHeadcount).toBe(10000);
      expect(result.totalPayrollUsdMinor).toBe(100000000000);
      expect(result.totalPayrollUsdMajor).toBe(1000000000);
      expect(result.currencyBreakdown).toHaveLength(1);
      expect(result.currencyBreakdown[0].currency).toBe('USD');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'analytics:summary',
        result,
        60000,
      );
    });
  });

  describe('getByCountry()', () => {
    it('should aggregate metrics per country and cache result', async () => {
      vi.mocked(cacheManager.get!).mockResolvedValue(null);
      vi.mocked(dataSource.query!).mockResolvedValue([
        {
          country: 'United States',
          currency: 'USD',
          headcount: 2000,
          totalUsdMinor: '25000000000',
          avgUsdMinor: '12500000',
        },
      ]);

      const result = await service.getByCountry();
      expect(result).toHaveLength(1);
      expect(result[0].country).toBe('United States');
      expect(result[0].totalUsdMajor).toBe(250000000);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'analytics:by-country',
        result,
        60000,
      );
    });
  });

  describe('getByDepartment()', () => {
    it('should aggregate metrics per department and cache result', async () => {
      vi.mocked(cacheManager.get!).mockResolvedValue(null);
      vi.mocked(dataSource.query!).mockResolvedValue([
        {
          department: 'Engineering',
          headcount: 1500,
          totalUsdMinor: '20000000000',
          avgUsdMinor: '13333333',
        },
      ]);

      const result = await service.getByDepartment();
      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('Engineering');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'analytics:by-department',
        result,
        60000,
      );
    });
  });

  describe('getByLevel()', () => {
    it('should aggregate band metrics per level and cache result', async () => {
      vi.mocked(cacheManager.get!).mockResolvedValue(null);
      vi.mocked(dataSource.query!).mockResolvedValue([
        {
          level: 'L3',
          headcount: 1200,
          totalUsdMinor: '15000000000',
          avgUsdMinor: '12500000',
          minUsdMinor: '10000000',
          maxUsdMinor: '16000000',
        },
      ]);

      const result = await service.getByLevel();
      expect(result).toHaveLength(1);
      expect(result[0].level).toBe('L3');
      expect(result[0].minUsdMinor).toBe(10000000);
      expect(result[0].maxUsdMinor).toBe(16000000);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'analytics:by-level',
        result,
        60000,
      );
    });
  });

  describe('invalidateCache()', () => {
    it('should delete all analytics cache keys', async () => {
      await service.invalidateCache();
      expect(cacheManager.del).toHaveBeenCalledWith('analytics:summary');
      expect(cacheManager.del).toHaveBeenCalledWith('analytics:by-country');
      expect(cacheManager.del).toHaveBeenCalledWith('analytics:by-department');
      expect(cacheManager.del).toHaveBeenCalledWith('analytics:by-level');
    });
  });
});
