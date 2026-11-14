import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryEmployeesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Items per page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search string across name, email, or employee ID',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Filter by job level (L1 - L6)' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'Filter by currency code (e.g. USD, EUR, GBP, SGD, INR, CAD)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    default: 'employeeId',
    enum: [
      'employeeId',
      'firstName',
      'lastName',
      'country',
      'department',
      'level',
      'baseSalaryMinor',
      'baseSalaryUsdMinor',
      'hireDate',
    ],
    description: 'Field to sort by',
  })
  @IsOptional()
  @IsIn([
    'employeeId',
    'firstName',
    'lastName',
    'country',
    'department',
    'level',
    'baseSalaryMinor',
    'baseSalaryUsdMinor',
    'hireDate',
  ])
  sortBy?: string = 'employeeId';

  @ApiPropertyOptional({
    default: 'ASC',
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
