import { describe, it, expect } from 'vitest';
import { ColumnNumericTransformer } from './column-numeric.transformer.js';

describe('ColumnNumericTransformer', () => {
  const transformer = new ColumnNumericTransformer();

  describe('to() - writing to database', () => {
    it('should transform a number to a number', () => {
      expect(transformer.to(500000)).toBe(500000);
    });

    it('should transform numeric string to number', () => {
      expect(transformer.to('500000')).toBe(500000);
    });

    it('should return null when input is null or undefined', () => {
      expect(transformer.to(null)).toBeNull();
      expect(transformer.to(undefined)).toBeNull();
    });

    it('should return null when input is invalid non-numeric string', () => {
      expect(transformer.to('invalid')).toBeNull();
    });
  });

  describe('from() - reading from database driver', () => {
    it('should safely deserialize postgres BIGINT string to a JavaScript number', () => {
      const result = transformer.from('500000');
      expect(typeof result).toBe('number');
      expect(result).toBe(500000);
    });

    it('should prevent string concatenation bugs during arithmetic', () => {
      const dbValue = transformer.from('500000');
      const bonus = 100000;
      // Without transformer: "500000" + 100000 = "500000100000"
      // With transformer: 500000 + 100000 = 600000
      expect((dbValue ?? 0) + bonus).toBe(600000);
    });

    it('should return number as is if driver already returns a number', () => {
      expect(transformer.from(500000)).toBe(500000);
    });

    it('should return null when input is null or undefined', () => {
      expect(transformer.from(null)).toBeNull();
      expect(transformer.from(undefined)).toBeNull();
    });

    it('should return null when input is an invalid string', () => {
      expect(transformer.from('not-a-number')).toBeNull();
    });
  });
});
