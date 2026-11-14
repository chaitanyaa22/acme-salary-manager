import {
  IsNotEmpty,
  IsString,
  IsPositive,
  Length,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'CAD', description: 'ISO currency code' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 10)
  code: string;

  @ApiProperty({ example: 'Canadian Dollar', description: 'Currency name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CA$', description: 'Currency symbol' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({
    example: 0.73,
    description: 'Planning exchange rate to USD (1 unit of currency = X USD)',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  rateToUsd: number;

  @ApiPropertyOptional({ default: true, description: 'Whether currency is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
