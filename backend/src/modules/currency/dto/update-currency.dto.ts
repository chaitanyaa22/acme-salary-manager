import { IsOptional, IsPositive, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCurrencyDto {
  @ApiPropertyOptional({
    example: 0.75,
    description: 'Updated exchange rate to USD (1 unit = X USD)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  rateToUsd?: number;

  @ApiPropertyOptional({ example: 'Canadian Dollar', description: 'Currency name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'CA$', description: 'Currency symbol' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether currency is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
