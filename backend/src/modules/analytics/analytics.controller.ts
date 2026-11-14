import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  AnalyticsService,
  AnalyticsSummary,
  CountryAnalytics,
  DepartmentAnalytics,
  LevelAnalytics,
} from './analytics.service.js';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get organization-wide payroll burn and summary metrics',
    description:
      'Answers total annual payroll commitment (normalized to USD) and breakdown by local currencies. Cached.',
  })
  @ApiResponse({ status: 200, description: 'High-level payroll analytics summary' })
  async getSummary(): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary();
  }

  @Get('by-country')
  @ApiOperation({
    summary: 'Get headcount and compensation breakdown by country',
    description: 'Calculates total and average USD compensation across 5 countries. Cached.',
  })
  @ApiResponse({ status: 200, description: 'Country-level compensation distribution' })
  async getByCountry(): Promise<CountryAnalytics[]> {
    return this.analyticsService.getByCountry();
  }

  @Get('by-department')
  @ApiOperation({
    summary: 'Get headcount and compensation breakdown by department',
    description: 'Calculates total and average USD compensation across departments. Cached.',
  })
  @ApiResponse({ status: 200, description: 'Department-level compensation distribution' })
  async getByDepartment(): Promise<DepartmentAnalytics[]> {
    return this.analyticsService.getByDepartment();
  }

  @Get('by-level')
  @ApiOperation({
    summary: 'Get headcount and compensation breakdown by job level (L1 - L6)',
    description:
      'Provides band distributions including min, max, and average USD compensation. Cached.',
  })
  @ApiResponse({ status: 200, description: 'Level-band compensation distribution' })
  async getByLevel(): Promise<LevelAnalytics[]> {
    return this.analyticsService.getByLevel();
  }
}
