import { ValueTransformer } from 'typeorm';

/**
 * TypeORM ValueTransformer to handle PostgreSQL BIGINT serialization.
 * PostgreSQL's `pg` driver returns BIGINT columns as JavaScript strings by default
 * to prevent precision loss (Number.MAX_SAFE_INTEGER).
 *
 * This transformer converts string values back to JavaScript numbers when reading (`from`),
 * ensuring arithmetic operations do not accidentally perform string concatenation
 * (e.g. "500000" + "100000" = "500000100000" instead of 600000).
 * Safe up to 9 quadrillion cents (~$90 trillion USD).
 */
export class ColumnNumericTransformer implements ValueTransformer {
  to(data?: number | string | null): number | null {
    if (data === null || data === undefined) {
      return null;
    }
    const parsed = Number(data);
    return Number.isNaN(parsed) ? null : parsed;
  }

  from(data?: string | number | null): number | null {
    if (data === null || data === undefined) {
      return null;
    }
    const parsed = Number(data);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
