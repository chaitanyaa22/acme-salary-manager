import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CurrencyService, EXCHANGE_RATES_TO_USD } from './currency.service.js';
import { Currency } from '../../common/enums/currency.enum.js';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(() => {
    service = new CurrencyService();
  });

  describe('getSupportedCurrencies()', () => {
    it('should support exactly USD, INR, GBP, EUR, and SGD', () => {
      const currencies = service.getSupportedCurrencies();
      expect(currencies).toEqual(
        expect.arrayContaining([
          Currency.USD,
          Currency.INR,
          Currency.GBP,
          Currency.EUR,
          Currency.SGD,
        ]),
      );
      expect(currencies).toHaveLength(5);
    });
  });

  describe('getExchangeRateToUsd()', () => {
    it('should return 1.0 for USD', () => {
      expect(service.getExchangeRateToUsd(Currency.USD)).toBe(1.0);
    });

    it('should return exact deterministic rates for all currencies', () => {
      expect(service.getExchangeRateToUsd(Currency.EUR)).toBe(1.08);
      expect(service.getExchangeRateToUsd(Currency.GBP)).toBe(1.28);
      expect(service.getExchangeRateToUsd(Currency.SGD)).toBe(0.74);
      expect(service.getExchangeRateToUsd(Currency.INR)).toBe(0.012);
    });

    it('should throw BadRequestException for unsupported currencies', () => {
      expect(() =>
        service.getExchangeRateToUsd('AUD' as Currency),
      ).toThrow(BadRequestException);
    });
  });

  describe('toUsdMinor()', () => {
    it('should return identical minor units for USD (1:1 identity, no drift)', () => {
      const amountUsdMinor = 12500000; // $125,000.00
      expect(service.toUsdMinor(amountUsdMinor, Currency.USD)).toBe(amountUsdMinor);
    });

    it('should convert INR paise to USD cents deterministically', () => {
      // 10,000,000 paise (100,000 INR) * 0.012 = 120,000 USD cents ($1,200.00)
      const inrPaise = 10_000_000;
      const expectedUsdCents = Math.round(inrPaise * EXCHANGE_RATES_TO_USD[Currency.INR]);
      expect(service.toUsdMinor(inrPaise, Currency.INR)).toBe(expectedUsdCents);
      expect(service.toUsdMinor(inrPaise, Currency.INR)).toBe(120_000);
    });

    it('should convert GBP pence to USD cents deterministically', () => {
      // 5,000,000 pence (£50,000.00) * 1.28 = 6,400,000 USD cents ($64,000.00)
      const gbpPence = 5_000_000;
      expect(service.toUsdMinor(gbpPence, Currency.GBP)).toBe(6_400_000);
    });

    it('should convert EUR cents to USD cents deterministically', () => {
      // 5,000,000 cents (€50,000.00) * 1.08 = 5,400,000 USD cents ($54,000.00)
      const eurCents = 5_000_000;
      expect(service.toUsdMinor(eurCents, Currency.EUR)).toBe(5_400_000);
    });

    it('should convert SGD cents to USD cents deterministically', () => {
      // 5,000,000 cents (S$50,000.00) * 0.74 = 3,700,000 USD cents ($37,000.00)
      const sgdCents = 5_000_000;
      expect(service.toUsdMinor(sgdCents, Currency.SGD)).toBe(3_700_000);
    });

    it('should always return an integer value without floating point fractional cents', () => {
      // 123456 paise * 0.012 = 1481.472 -> should round to 1481 cents
      const result = service.toUsdMinor(123456, Currency.INR);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(1481);
    });

    it('should handle zero amounts cleanly', () => {
      expect(service.toUsdMinor(0, Currency.USD)).toBe(0);
      expect(service.toUsdMinor(0, Currency.INR)).toBe(0);
    });

    it('should throw BadRequestException when given negative numbers', () => {
      expect(() => service.toUsdMinor(-1000, Currency.USD)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when given non-finite or NaN inputs', () => {
      expect(() => service.toUsdMinor(NaN, Currency.USD)).toThrow(
        BadRequestException,
      );
      expect(() => service.toUsdMinor(Infinity, Currency.USD)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for unsupported currencies', () => {
      expect(() =>
        service.toUsdMinor(100000, 'JPY' as Currency),
      ).toThrow(BadRequestException);
    });
  });

  describe('fromUsdMinor()', () => {
    it('should convert USD minor to local currency minor units', () => {
      const usdMinor = 6_400_000; // $64,000.00
      // 6,400,000 / 1.28 = 5,000,000 GBP pence
      expect(service.fromUsdMinor(usdMinor, Currency.GBP)).toBe(5_000_000);
    });

    it('should return exact integer for USD target', () => {
      expect(service.fromUsdMinor(500000, Currency.USD)).toBe(500000);
    });
  });

  describe('convert()', () => {
    it('should return identical amount when from and to currencies are the same', () => {
      expect(service.convert(500000, Currency.INR, Currency.INR)).toBe(500000);
    });

    it('should convert between two non-USD currencies through USD', () => {
      // 100,000 INR (10,000,000 paise) -> 120,000 USD cents
      // 120,000 USD cents / 1.08 = 111,111 EUR cents
      const result = service.convert(10_000_000, Currency.INR, Currency.EUR);
      expect(result).toBe(111_111);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('toMajorUnits() and toMinorUnits()', () => {
    it('should convert minor units to major units', () => {
      expect(service.toMajorUnits(12500050)).toBe(125000.5);
      expect(service.toMajorUnits(0)).toBe(0);
    });

    it('should convert major units to minor units', () => {
      expect(service.toMinorUnits(125000.5)).toBe(12500050);
      expect(service.toMinorUnits(0)).toBe(0);
    });

    it('should round floating precision during major to minor conversion', () => {
      expect(service.toMinorUnits(99.99)).toBe(9999);
    });

    it('should reject invalid numbers during major to minor conversion', () => {
      expect(() => service.toMinorUnits(-10)).toThrow(BadRequestException);
      expect(() => service.toMinorUnits(NaN)).toThrow(BadRequestException);
    });
  });
});
