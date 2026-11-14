import { Injectable, BadRequestException } from '@nestjs/common';
import { Currency } from '../../common/enums/currency.enum.js';

/**
 * Deterministic Analytical FX rates to USD (ADR-02).
 * External live FX APIs introduce network latency, failure modes, and analytical drift.
 * ACME utilizes a deterministic fixed baseline rate for org-wide normalization:
 * - 1 USD = 1.00 USD
 * - 1 EUR = 1.08 USD
 * - 1 GBP = 1.28 USD
 * - 1 SGD = 0.74 USD
 * - 1 INR = 0.012 USD (~83.33 INR/USD)
 */
export const EXCHANGE_RATES_TO_USD: Readonly<Record<Currency, number>> = Object.freeze({
  [Currency.USD]: 1.0,
  [Currency.EUR]: 1.08,
  [Currency.GBP]: 1.28,
  [Currency.SGD]: 0.74,
  [Currency.INR]: 0.012,
});

@Injectable()
export class CurrencyService {
  private readonly rates = EXCHANGE_RATES_TO_USD;

  /**
   * Returns list of supported ISO currency codes.
   */
  getSupportedCurrencies(): Currency[] {
    return Object.values(Currency);
  }

  /**
   * Retrieves deterministic exchange rate from currency to USD.
   */
  getExchangeRateToUsd(currency: Currency): number {
    this.assertSupportedCurrency(currency);
    return this.rates[currency];
  }

  /**
   * Converts local currency minor units (e.g. cents, paise, pence) to USD minor units (cents).
   * Ensures integer precision using Math.round() to prevent floating point drift.
   */
  toUsdMinor(amountMinor: number, currency: Currency): number {
    this.validateAmountMinor(amountMinor);
    this.assertSupportedCurrency(currency);

    if (currency === Currency.USD) {
      return Math.round(amountMinor);
    }

    const rate = this.rates[currency];
    return Math.round(amountMinor * rate);
  }

  /**
   * Converts USD minor units (cents) to target local currency minor units.
   */
  fromUsdMinor(amountUsdMinor: number, targetCurrency: Currency): number {
    this.validateAmountMinor(amountUsdMinor);
    this.assertSupportedCurrency(targetCurrency);

    if (targetCurrency === Currency.USD) {
      return Math.round(amountUsdMinor);
    }

    const rate = this.rates[targetCurrency];
    return Math.round(amountUsdMinor / rate);
  }

  /**
   * Converts an amount between any two supported currencies in minor units.
   */
  convert(amountMinor: number, fromCurrency: Currency, toCurrency: Currency): number {
    this.validateAmountMinor(amountMinor);
    this.assertSupportedCurrency(fromCurrency);
    this.assertSupportedCurrency(toCurrency);

    if (fromCurrency === toCurrency) {
      return Math.round(amountMinor);
    }

    const usdMinor = this.toUsdMinor(amountMinor, fromCurrency);
    return this.fromUsdMinor(usdMinor, toCurrency);
  }

  /**
   * Converts minor units (cents/paise) to major units (dollars/rupees) for UI display.
   */
  toMajorUnits(amountMinor: number): number {
    this.validateAmountMinor(amountMinor);
    return amountMinor / 100;
  }

  /**
   * Converts major units (dollars/rupees) to minor units (cents/paise) for storage.
   */
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

  private assertSupportedCurrency(currency: Currency): void {
    if (!currency || !(currency in this.rates)) {
      throw new BadRequestException(`Unsupported currency: ${currency}. Supported: ${this.getSupportedCurrencies().join(', ')}`);
    }
  }
}
