import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsInt,
  IsPositive,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../common/enums/currency.enum.js';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ example: 'Connor' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({ example: 'sarah.connor@acme.com' })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @ApiProperty({ example: 'L4' })
  @IsString()
  @IsNotEmpty({ message: 'Level is required' })
  level: string;

  @ApiProperty({ example: 'Staff Software Engineer' })
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  jobTitle: string;

  @ApiProperty({ enum: Currency, example: Currency.USD })
  @IsEnum(Currency, { message: 'Currency must be one of: USD, EUR, GBP, SGD, INR' })
  currency: Currency;

  @ApiProperty({
    example: 14500000,
    description: 'Starting base salary in local currency minor units (e.g. cents, paise)',
  })
  @Type(() => Number)
  @IsInt({ message: 'Base salary must be an integer in minor units' })
  @IsPositive({ message: 'Base salary must be greater than zero' })
  baseSalaryMinor: number;

  @ApiProperty({
    example: '2026-11-14',
    description: 'Hire date in YYYY-MM-DD format',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Hire date must follow YYYY-MM-DD format',
  })
  hireDate: string;
}
