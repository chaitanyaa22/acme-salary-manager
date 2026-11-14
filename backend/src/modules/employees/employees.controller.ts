import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service.js';
import { QueryEmployeesDto } from './dto/query-employees.dto.js';
import { UpdateSalaryDto } from './dto/update-salary.dto.js';
import { Employee } from '../../database/entities/employee.entity.js';
import { SalaryHistory } from '../../database/entities/salary-history.entity.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({
    summary: 'Search, filter, and paginate employee compensation directory',
    description:
      'High-performance pagination across 10,000 global employee records with multi-facet filtering (country, dept, level, currency).',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated employee list with metadata',
  })
  async findAll(
    @Query() query: QueryEmployeesDto,
  ): Promise<PaginatedResponseDto<Employee>> {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee details by UUID' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee record found' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Employee> {
    return this.employeesService.findById(id);
  }

  @Patch(':id/salary')
  @Roles(UserRole.HR_ADMIN)
  @ApiOperation({
    summary: 'Revise employee salary atomically inside database transaction (HR_ADMIN only)',
    description:
      'Per ADR-04, atomically updates base salary, recalculates normalized USD amount, and creates an immutable SalaryHistory audit entry.',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({
    status: 200,
    description: 'Salary revised and audit trail recorded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid salary amount or identical salary provided',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Requires HR_ADMIN role (HR_VIEWER cannot revise salaries)',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateSalary(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalaryDto,
    @CurrentUser('email') userEmail: string,
  ): Promise<Employee> {
    return this.employeesService.updateSalary(id, dto, userEmail);
  }

  @Get(':id/salary-history')
  @ApiOperation({
    summary: 'Retrieve immutable historical salary adjustments for an employee',
  })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({
    status: 200,
    description: 'Chronological list of salary changes',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getSalaryHistory(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SalaryHistory[]> {
    return this.employeesService.getSalaryHistory(id);
  }
}
