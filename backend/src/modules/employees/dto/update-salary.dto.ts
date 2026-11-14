import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSalaryDto {
  @ApiProperty({
    example: 13500000,
    description: 'New base salary in local currency minor units (cents/paise/pence)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive({ message: 'Salary must be a positive integer in minor units' })
  newSalaryMinor: number;

  @ApiProperty({
    example: '2026-11-15',
    description: 'Effective date of salary revision in YYYY-MM-DD format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Effective date must follow YYYY-MM-DD format',
  })
  effectiveDate: string;

  @ApiProperty({
    example: 'Annual performance merit increase to L4 tier',
    description: 'Business reason for salary revision audit trail',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Reason must be at least 3 characters' })
  reason: string;
}
