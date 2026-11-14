import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyService } from './currency.service.js';
import { CurrenciesController } from './currencies.controller.js';
import { ExchangeRate } from '../../database/entities/exchange-rate.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate])],
  controllers: [CurrenciesController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
