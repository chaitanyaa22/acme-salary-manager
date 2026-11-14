import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Optional,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Currency } from '../../common/enums/currency.enum.js';
import { ExchangeRate } from '../../database/entities/exchange-rate.entity.js';
import { CreateCurrencyDto } from './dto/create-currency.dto.js';
import { UpdateCurrencyDto } from './dto/update-currency.dto.js';

/**
 * Deterministic Baseline FX rates to USD (ADR-02 / ADR-07).
 * Seeded into PostgreSQL exchange_rates table on initial startup.
 */
export const DEFAULT_EXCHANGE_RATES: Readonly<
  Record<
    string,
    { rateToUsd: number; name: string; symbol: string }
  >
> = Object.freeze({
  USD: { rateToUsd: 1.0, name: 'US Dollar', symbol: '$' },
  EUR: { rateToUsd: 1.08, name: 'Euro', symbol: '€' },
  GBP: { rateToUsd: 1.28, name: 'British Pound', symbol: '£' },
  SGD: { rateToUsd: 0.74, name: 'Singapore Dollar', symbol: 'S$' },
  INR: { rateToUsd: 0.012, name: 'Indian Rupee', symbol: '₹' },
});

export const EXCHANGE_RATES_TO_USD: Readonly<Record<Currency, number>> = Object.freeze({
  [Currency.USD]: 1.0,
  [Currency.EUR]: 1.08,
  [Currency.GBP]: 1.28,
  [Currency.SGD]: 0.74,
  [Currency.INR]: 0.012,
});

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);
  private ratesCache: Map<string, number> = new Map();

  constructor(
    @Optional()
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo?: Repository<ExchangeRate>,
    @Optional()
    private readonly dataSource?: DataSource,
  ) {
    // Initialize in-memory cache with baseline rates
    Object.entries(DEFAULT_EXCHANGE_RATES).forEach(([code, data]) => {
      this.ratesCache.set(code, data.rateToUsd);
    });
  }

  async onModuleInit() {
    if (this.exchangeRateRepo) {
      await this.syncDatabaseRates();
    }
  }

  /**
   * Synchronizes and seeds initial exchange rates into the database.
   */
  async syncDatabaseRates(): Promise<void> {
    if (!this.exchangeRateRepo) return;

    try {
      const existing = await this.exchangeRateRepo.find();
      if (existing.length === 0) {
        // Seed default rates
        const entities = Object.entries(DEFAULT_EXCHANGE_RATES).map(
          ([code, data]) =>
            this.exchangeRateRepo!.create({
              code,
              name: data.name,
              symbol: data.symbol,
              rateToUsd: data.rateToUsd,
              isActive: true,
            }),
        );
        await this.exchangeRateRepo.save(entities);
        this.logger.log('Seeded 5 baseline exchange rates into database.');
        existing.push(...entities);
      }

      // Populate memory cache
      existing.forEach((r) => {
        if (r.isActive) {
          this.ratesCache.set(r.code, Number(r.rateToUsd));
        }
      });
    } catch (err: any) {
      this.logger.warn(`Could not sync database exchange rates: ${err.message}`);
    }
  }

  /**
   * Retrieves all currencies and rates from the database.
   */
  async getAllCurrencies(): Promise<ExchangeRate[]> {
    if (this.exchangeRateRepo) {
      const dbRates = await this.exchangeRateRepo.find({
        order: { code: 'ASC' },
      });
      if (dbRates.length > 0) return dbRates;
    }

    // Fallback if database not available
    return Object.entries(DEFAULT_EXCHANGE_RATES).map(([code, data]) => ({
      code,
      name: data.name,
      symbol: data.symbol,
      rateToUsd: data.rateToUsd,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  /**
   * Registers a new currency (HR_ADMIN only).
   */
  async createCurrency(dto: CreateCurrencyDto): Promise<ExchangeRate> {
    const code = dto.code.trim().toUpperCase();

    if (this.exchangeRateRepo) {
      const existing = await this.exchangeRateRepo.findOne({ where: { code } });
      if (existing) {
        throw new ConflictException(`Currency code ${code} is already registered.`);
      }

      const entity = this.exchangeRateRepo.create({
        code,
        name: dto.name.trim(),
        symbol: dto.symbol?.trim() || '$',
        rateToUsd: dto.rateToUsd,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      });

      const saved = await this.exchangeRateRepo.save(entity);
      if (saved.isActive) {
        this.ratesCache.set(saved.code, Number(saved.rateToUsd));
      }
      return saved;
    }

    // In-memory fallback
    this.ratesCache.set(code, dto.rateToUsd);
    return {
      code,
      name: dto.name,
      symbol: dto.symbol || '$',
      rateToUsd: dto.rateToUsd,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Updates an existing currency rate (HR_ADMIN only).
   * Automatically recalibrates active employee normalized USD compensation.
   */
  async updateCurrency(code: string, dto: UpdateCurrencyDto): Promise<ExchangeRate> {
    const upperCode = code.trim().toUpperCase();

    let entity: ExchangeRate | null = null;
    if (this.exchangeRateRepo) {
      entity = await this.exchangeRateRepo.findOne({ where: { code: upperCode } });
      if (!entity) {
        throw new NotFoundException(`Currency ${upperCode} not found.`);
      }

      if (dto.name !== undefined) entity.name = dto.name.trim();
      if (dto.symbol !== undefined) entity.symbol = dto.symbol.trim();
      if (dto.rateToUsd !== undefined) entity.rateToUsd = dto.rateToUsd;
      if (dto.isActive !== undefined) entity.isActive = dto.isActive;

      entity = await this.exchangeRateRepo.save(entity);
      if (entity.isActive) {
        this.ratesCache.set(upperCode, Number(entity.rateToUsd));
      } else {
        this.ratesCache.delete(upperCode);
      }

      // If rate changed, recalculate base_salary_usd_minor for employees in that currency
      if (dto.rateToUsd !== undefined && this.dataSource) {
        try {
          await this.dataSource.query(
            `UPDATE employees 
             SET base_salary_usd_minor = ROUND(base_salary_minor * $1),
                 updated_at = NOW()
             WHERE currency = $2 AND is_active = true`,
            [dto.rateToUsd, upperCode],
          );
          this.logger.log(`Recalculated USD base salaries for active employees in ${upperCode} at rate ${dto.rateToUsd}`);
        } catch (err: any) {
          this.logger.warn(`Failed to auto-recalculate employee USD salaries: ${err.message}`);
        }
      }
    } else {
      if (dto.rateToUsd !== undefined) {
        this.ratesCache.set(upperCode, dto.rateToUsd);
      }
      entity = {
        code: upperCode,
        name: dto.name || upperCode,
        symbol: dto.symbol || '$',
        rateToUsd: dto.rateToUsd || 1.0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return entity;
  }

  /**
   * Returns list of currently active supported ISO currency codes.
   */
  getSupportedCurrencies(): string[] {
    return Array.from(this.ratesCache.keys());
  }

  /**
   * Retrieves deterministic exchange rate from currency to USD.
   */
  getExchangeRateToUsd(currency: string): number {
    const upper = currency.toUpperCase();
    this.assertSupportedCurrency(upper);
    return this.ratesCache.get(upper)!;
  }

  /**
   * Converts local currency minor units to USD minor units (cents).
   */
  toUsdMinor(amountMinor: number, currency: string): number {
    this.validateAmountMinor(amountMinor);
    const upper = currency.toUpperCase();
    this.assertSupportedCurrency(upper);

    if (upper === 'USD') {
      return Math.round(amountMinor);
    }

    const rate = this.ratesCache.get(upper)!;
    return Math.round(amountMinor * rate);
  }

  /**
   * Converts USD minor units (cents) to target local currency minor units.
   */
  fromUsdMinor(amountUsdMinor: number, targetCurrency: string): number {
    this.validateAmountMinor(amountUsdMinor);
    const upper = targetCurrency.toUpperCase();
    this.assertSupportedCurrency(upper);

    if (upper === 'USD') {
      return Math.round(amountUsdMinor);
    }

    const rate = this.ratesCache.get(upper)!;
    return Math.round(amountUsdMinor / rate);
  }

  /**
   * Converts an amount between any two supported currencies in minor units.
   */
  convert(amountMinor: number, fromCurrency: string, toCurrency: string): number {
    this.validateAmountMinor(amountMinor);
    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();
    this.assertSupportedCurrency(fromUpper);
    this.assertSupportedCurrency(toUpper);

    if (fromUpper === toUpper) {
      return Math.round(amountMinor);
    }

    const usdMinor = this.toUsdMinor(amountMinor, fromUpper);
    return this.fromUsdMinor(usdMinor, toUpper);
  }

  toMajorUnits(amountMinor: number): number {
    this.validateAmountMinor(amountMinor);
    return amountMinor / 100;
  }

  toMinorUnits(amountMajor: number): number {
    if (typeof amountMajor !== 'number' || !Number.isFinite(amountMajor) || amountMajor < 0) {
      throw new BadRequestException(`Invalid amount: ${amountMajor}. Must be a non-negative finite number.`);
    }
    return Math.round(amountMajor * 100);
  }

  private validateAmountMinor(amountMinor: number): void {
    if (typeof amountMinor !== 'number' || !Number.isFinite(amountMinor) || amountMinor < 0) {
      throw new BadRequestException(
        `Invalid minor-unit monetary amount: ${amountMinor}. Must be a non-negative finite number.`,
      );
    }
  }

  private assertSupportedCurrency(currency: string): void {
    if (!currency || !this.ratesCache.has(currency)) {
      throw new BadRequestException(
        `Unsupported currency: ${currency}. Supported: ${this.getSupportedCurrencies().join(', ')}`,
      );
    }
  }
}
