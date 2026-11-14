import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Currency } from '../../common/enums/currency.enum.js';
import { ColumnNumericTransformer } from '../../common/transformers/column-numeric.transformer.js';
import { SalaryHistory } from './salary-history.entity.js';

@Entity('employees')
@Index('idx_employees_country_dept_level', ['country', 'department', 'level'])
@Index('idx_employees_base_salary_usd_minor', ['baseSalaryUsdMinor'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id', unique: true })
  @Index('idx_employees_employee_id', { unique: true })
  employeeId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  @Index('idx_employees_email', { unique: true })
  email: string;

  @Column()
  country: string;

  @Column()
  department: string;

  @Column()
  level: string;

  @Column({ name: 'job_title' })
  jobTitle: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @Column({
    name: 'base_salary_minor',
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  baseSalaryMinor: number;

  @Column({
    name: 'base_salary_usd_minor',
    type: 'bigint',
    transformer: new ColumnNumericTransformer(),
  })
  baseSalaryUsdMinor: number;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => SalaryHistory, (salaryHistory) => salaryHistory.employee, {
    cascade: true,
  })
  salaryHistories: SalaryHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
