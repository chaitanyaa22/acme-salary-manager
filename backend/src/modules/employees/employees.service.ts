import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Employee } from '../../database/entities/employee.entity.js';
import { SalaryHistory } from '../../database/entities/salary-history.entity.js';
import { QueryEmployeesDto } from './dto/query-employees.dto.js';
import { UpdateSalaryDto } from './dto/update-salary.dto.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { CurrencyService } from '../currency/currency.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(SalaryHistory)
    private readonly salaryHistoryRepository: Repository<SalaryHistory>,
    private readonly dataSource: DataSource,
    private readonly currencyService: CurrencyService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Retrieves paginated, filtered, and sorted employee records across 10,000 rows.
   * Leverages composite indexes on (country, department, level) and (base_salary_usd_minor).
   */
  async findAll(query: QueryEmployeesDto): Promise<PaginatedResponseDto<Employee>> {
    const {
      page = 1,
      limit = 20,
      search,
      country,
      department,
      level,
      currency,
      sortBy = 'employeeId',
      sortOrder = 'ASC',
    } = query;

    const qb: SelectQueryBuilder<Employee> = this.employeeRepository.createQueryBuilder('emp');

    qb.where('emp.isActive = :isActive', { isActive: true });

    // Multi-facet filtering
    if (country) {
      qb.andWhere('emp.country = :country', { country });
    }
    if (department) {
      qb.andWhere('emp.department = :department', { department });
    }
    if (level) {
      qb.andWhere('emp.level = :level', { level });
    }
    if (currency) {
      qb.andWhere('emp.currency = :currency', { currency });
    }

    // Debounced search across name, email, or employeeId
    if (search && search.trim().length > 0) {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(emp.firstName) LIKE :term OR LOWER(emp.lastName) LIKE :term OR LOWER(emp.email) LIKE :term OR LOWER(emp.employeeId) LIKE :term)',
        { term },
      );
    }

    // Sorting
    const sortFieldMap: Record<string, string> = {
      employeeId: 'emp.employeeId',
      firstName: 'emp.firstName',
      lastName: 'emp.lastName',
      country: 'emp.country',
      department: 'emp.department',
      level: 'emp.level',
      baseSalaryMinor: 'emp.baseSalaryMinor',
      baseSalaryUsdMinor: 'emp.baseSalaryUsdMinor',
      hireDate: 'emp.hireDate',
    };

    const targetSortField = sortFieldMap[sortBy] || 'emp.employeeId';
    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    qb.orderBy(targetSortField, direction);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single employee record by UUID.
   */
  async findById(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: {
        salaryHistories: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" was not found.`);
    }

    return employee;
  }

  /**
   * Transactional salary revision (ADR-04).
   * Atomically updates employee base salary, computes normalized USD equivalent,
   * inserts an immutable audit log into salary_history, and invalidates analytics cache.
   */
  async updateSalary(
    employeeId: string,
    dto: UpdateSalaryDto,
    changedBy: string,
  ): Promise<Employee> {
    return this.dataSource.transaction(async (manager) => {
      const employee = await manager.findOne(Employee, {
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID "${employeeId}" was not found.`);
      }

      if (dto.newSalaryMinor === employee.baseSalaryMinor) {
        throw new BadRequestException(
          'New salary amount cannot be identical to current salary amount.',
        );
      }

      // 1. Calculate normalized USD minor units (ADR-02)
      const newSalaryUsdMinor = this.currencyService.toUsdMinor(
        dto.newSalaryMinor,
        employee.currency,
      );

      // 2. Insert immutable audit trail record
      const salaryHistory = manager.create(SalaryHistory, {
        employeeId: employee.id,
        previousSalaryMinor: employee.baseSalaryMinor,
        newSalaryMinor: dto.newSalaryMinor,
        previousSalaryUsdMinor: employee.baseSalaryUsdMinor,
        newSalaryUsdMinor,
        currency: employee.currency,
        effectiveDate: dto.effectiveDate,
        reason: dto.reason,
        changedBy,
      });
      await manager.save(SalaryHistory, salaryHistory);

      // 3. Atomically update employee record
      employee.baseSalaryMinor = dto.newSalaryMinor;
      employee.baseSalaryUsdMinor = newSalaryUsdMinor;
      const updatedEmployee = await manager.save(Employee, employee);

      // 4. Invalidate analytics cache (ADR-03)
      await this.analyticsService.invalidateCache();

      this.logger.log(
        `Salary updated for employee ${employee.employeeId} (${employee.firstName} ${employee.lastName}) by ${changedBy}. New base: ${dto.newSalaryMinor} (${employee.currency}) -> ${newSalaryUsdMinor} (USD)`,
      );

      return updatedEmployee;
    });
  }

  /**
   * Retrieves full chronological audit history for an employee.
   */
  async getSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    await this.findById(employeeId); // Verify employee exists

    return this.salaryHistoryRepository.find({
      where: { employeeId },
      order: { effectiveDate: 'DESC', createdAt: 'DESC' },
    });
  }
}
