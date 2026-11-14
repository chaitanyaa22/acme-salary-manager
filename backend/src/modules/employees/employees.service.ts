import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Employee } from '../../database/entities/employee.entity.js';
import { SalaryHistory } from '../../database/entities/salary-history.entity.js';
import { QueryEmployeesDto } from './dto/query-employees.dto.js';
import { UpdateSalaryDto } from './dto/update-salary.dto.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
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

    // Search across full name, firstName, lastName, email, or employeeId
    if (search && search.trim().length > 0) {
      const cleanSearch = search.trim().replace(/\s+/g, ' ');
      const term = `%${cleanSearch.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(CONCAT(emp.firstName, \' \', emp.lastName)) LIKE :term OR LOWER(CONCAT(emp.lastName, \' \', emp.firstName)) LIKE :term OR LOWER(emp.firstName) LIKE :term OR LOWER(emp.lastName) LIKE :term OR LOWER(emp.email) LIKE :term OR LOWER(emp.employeeId) LIKE :term)',
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

  /**
   * Onboards a new employee (ADR-06).
   * Generates sequential employeeId, computes normalized USD salary,
   * inserts employee and initial SalaryHistory audit record, and invalidates analytics cache.
   */
  async createEmployee(
    dto: CreateEmployeeDto,
    changedBy: string,
  ): Promise<Employee> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Enforce email uniqueness
      const existingEmail = await manager.findOne(Employee, {
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existingEmail) {
        throw new ConflictException(
          `Employee with email "${dto.email}" already exists.`,
        );
      }

      // 2. Generate sequential unique employeeId
      const count = await manager.count(Employee);
      let nextSeq = count + 1;
      let employeeId = `ACM-${nextSeq.toString().padStart(5, '0')}`;
      while (await manager.findOne(Employee, { where: { employeeId } })) {
        nextSeq++;
        employeeId = `ACM-${nextSeq.toString().padStart(5, '0')}`;
      }

      // 3. Compute normalized USD minor units
      const baseSalaryUsdMinor = this.currencyService.toUsdMinor(
        dto.baseSalaryMinor,
        dto.currency,
      );

      // 4. Save new employee
      const employee = manager.create(Employee, {
        employeeId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.toLowerCase().trim(),
        country: dto.country.trim(),
        department: dto.department.trim(),
        level: dto.level.trim(),
        jobTitle: dto.jobTitle.trim(),
        currency: dto.currency,
        baseSalaryMinor: dto.baseSalaryMinor,
        baseSalaryUsdMinor,
        hireDate: dto.hireDate,
        isActive: true,
      });
      const savedEmployee = await manager.save(Employee, employee);

      // 5. Create initial salary history audit record
      const salaryHistory = manager.create(SalaryHistory, {
        employeeId: savedEmployee.id,
        previousSalaryMinor: 0,
        newSalaryMinor: dto.baseSalaryMinor,
        previousSalaryUsdMinor: 0,
        newSalaryUsdMinor: baseSalaryUsdMinor,
        currency: dto.currency,
        effectiveDate: dto.hireDate,
        reason: 'Initial employment offer',
        changedBy,
      });
      await manager.save(SalaryHistory, salaryHistory);

      // 6. Invalidate analytics cache
      await this.analyticsService.invalidateCache();

      this.logger.log(
        `New employee ${employeeId} (${savedEmployee.firstName} ${savedEmployee.lastName}) onboarded by ${changedBy}.`,
      );

      return savedEmployee;
    });
  }

  /**
   * Offboards / soft-deletes an employee (ADR-06).
   * Sets isActive = false, creates separation audit record, and invalidates analytics cache.
   */
  async deactivateEmployee(
    id: string,
    changedBy: string,
  ): Promise<Employee> {
    return this.dataSource.transaction(async (manager) => {
      const employee = await manager.findOne(Employee, {
        where: { id },
      });

      if (!employee) {
        throw new NotFoundException(`Employee with ID "${id}" was not found.`);
      }

      if (!employee.isActive) {
        throw new BadRequestException(
          `Employee ${employee.employeeId} (${employee.firstName} ${employee.lastName}) is already deactivated.`,
        );
      }

      employee.isActive = false;
      const updatedEmployee = await manager.save(Employee, employee);

      // Record separation in audit history
      const salaryHistory = manager.create(SalaryHistory, {
        employeeId: employee.id,
        previousSalaryMinor: employee.baseSalaryMinor,
        newSalaryMinor: 0,
        previousSalaryUsdMinor: employee.baseSalaryUsdMinor,
        newSalaryUsdMinor: 0,
        currency: employee.currency,
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: 'Employee offboarding / separation',
        changedBy,
      });
      await manager.save(SalaryHistory, salaryHistory);

      // Invalidate analytics cache
      await this.analyticsService.invalidateCache();

      this.logger.log(
        `Employee ${employee.employeeId} (${employee.firstName} ${employee.lastName}) offboarded by ${changedBy}.`,
      );

      return updatedEmployee;
    });
  }
}
