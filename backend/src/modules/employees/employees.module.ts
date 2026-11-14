import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../database/entities/employee.entity.js';
import { SalaryHistory } from '../../database/entities/salary-history.entity.js';
import { EmployeesService } from './employees.service.js';
import { EmployeesController } from './employees.controller.js';
import { CurrencyModule } from '../currency/currency.module.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, SalaryHistory]),
    CurrencyModule,
    AnalyticsModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
